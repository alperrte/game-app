package com.ltz.game_service.config;

import com.ltz.game_service.exception.RateLimitExceededException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ExternalApiRateLimitInterceptor implements HandlerInterceptor {

    private final boolean enabled;
    private final int maxRequests;
    private final long windowSeconds;

    private final Map<String, RateLimitBucket> buckets = new ConcurrentHashMap<>();

    public ExternalApiRateLimitInterceptor(
            @Value("${external.api.rate-limit.enabled:true}") boolean enabled,
            @Value("${external.api.rate-limit.max-requests:60}") int maxRequests,
            @Value("${external.api.rate-limit.window-seconds:60}") long windowSeconds
    ) {
        this.enabled = enabled;
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {
        if (!enabled) {
            return true;
        }

        String clientKey = resolveClientKey(request);
        long now = Instant.now().getEpochSecond();

        RateLimitBucket bucket = buckets.compute(
                clientKey,
                (key, existingBucket) -> {
                    if (existingBucket == null || now >= existingBucket.windowExpiresAt()) {
                        return new RateLimitBucket(1, now + windowSeconds);
                    }

                    return new RateLimitBucket(
                            existingBucket.requestCount() + 1,
                            existingBucket.windowExpiresAt()
                    );
                }
        );

        cleanupExpiredBuckets(now);

        if (bucket.requestCount() > maxRequests) {
            throw new RateLimitExceededException();
        }

        response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, maxRequests - bucket.requestCount())));
        response.setHeader("X-RateLimit-Reset", String.valueOf(bucket.windowExpiresAt()));

        return true;
    }

    private String resolveClientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");

        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = request.getHeader("X-Real-IP");

        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        return request.getRemoteAddr();
    }

    private void cleanupExpiredBuckets(long now) {
        if (buckets.size() < 1000) {
            return;
        }

        buckets.entrySet().removeIf(entry -> now >= entry.getValue().windowExpiresAt());
    }

    private record RateLimitBucket(
            int requestCount,
            long windowExpiresAt
    ) {
    }
}