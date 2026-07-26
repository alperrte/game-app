package com.ltz.content_service.service.scheduler;

import com.ltz.content_service.repository.DealCampaignRepository;
import com.ltz.content_service.repository.NewsArticleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataPruningScheduler {

    private final NewsArticleRepository newsArticleRepository;
    private final DealCampaignRepository dealCampaignRepository;

    @Scheduled(cron = "0 0 4 * * *")
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "news", allEntries = true),
            @CacheEvict(value = "deals", allEntries = true)
    })
    public void pruneOldData() {
        log.info("Starting daily data pruning job...");
        try {
            // Delete news articles older than 30 days
            LocalDateTime newsCutoff = LocalDateTime.now().minusDays(30);
            newsArticleRepository.deleteByCreatedAtBefore(newsCutoff);
            log.info("Pruned news articles older than 30 days.");

            // Delete deal campaigns not updated in the last 7 days
            LocalDateTime dealsCutoff = LocalDateTime.now().minusDays(7);
            dealCampaignRepository.deleteByLastUpdatedBefore(dealsCutoff);
            log.info("Pruned deal campaigns older than 7 days.");
        } catch (Exception e) {
            log.error("Error running data pruning job: ", e);
        }
    }
}
