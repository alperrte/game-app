package com.ltz.game_service.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.List;

@Configuration
public class CacheConfig {

    public static final String EXTERNAL_GAME_PLATFORMS = "externalGamePlatforms";
    public static final String EXTERNAL_GAME_CATEGORIES = "externalGameCategories";
    public static final String EXTERNAL_GAME_SEARCH = "externalGameSearch";
    public static final String EXTERNAL_GAME_DETAIL = "externalGameDetail";

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();

        cacheManager.setCaches(List.of(
                buildCache(EXTERNAL_GAME_PLATFORMS, Duration.ofMinutes(30), 100),
                buildCache(EXTERNAL_GAME_CATEGORIES, Duration.ofMinutes(30), 500),
                buildCache(EXTERNAL_GAME_SEARCH, Duration.ofMinutes(10), 1000),
                buildCache(EXTERNAL_GAME_DETAIL, Duration.ofHours(6), 2000)
        ));

        return cacheManager;
    }

    private CaffeineCache buildCache(String cacheName, Duration ttl, long maximumSize) {
        return new CaffeineCache(
                cacheName,
                Caffeine.newBuilder()
                        .expireAfterWrite(ttl)
                        .maximumSize(maximumSize)
                        .recordStats()
                        .build()
        );
    }
}