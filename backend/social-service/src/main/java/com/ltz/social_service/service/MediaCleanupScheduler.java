package com.ltz.social_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
@Slf4j
public class MediaCleanupScheduler {

    private final MediaStorageService mediaStorageService;

    @Value("${app.media.pending-ttl-minutes:60}")
    private long pendingTtlMinutes;

    @Scheduled(fixedDelayString = "${app.media.cleanup-fixed-delay-ms:900000}")
    public void cleanupPendingMedia() {
        int deletedCount = mediaStorageService.cleanupPendingMedia(
                Duration.ofMinutes(pendingTtlMinutes)
        );

        if (deletedCount > 0) {
            log.info("Cleaned up {} pending media asset(s)", deletedCount);
        }
    }
}
