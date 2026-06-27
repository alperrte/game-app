package com.ltz.content_service.init;

import com.ltz.content_service.service.scheduler.DealsScheduler;
import com.ltz.content_service.service.scheduler.NewsScheduler;
import com.ltz.content_service.service.scheduler.StatsScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class StartupInitializer {

    private final NewsScheduler newsScheduler;
    private final DealsScheduler dealsScheduler;
    private final StatsScheduler statsScheduler;

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        log.info("Application started! Triggering initial data fetch in a separate thread...");
        new Thread(() -> {
            try {
                newsScheduler.fetchNews();
                dealsScheduler.fetchDeals();
                statsScheduler.fetchPlatformStats();
                statsScheduler.fetchFreeGamesAndGiveaways();
                statsScheduler.fetchSpeedrunRecords();
                statsScheduler.generateOrUpdateEsportMatches();
                log.info("Initial data fetch completed successfully!");
            } catch (Exception e) {
                log.error("Error during initial startup data fetch: ", e);
            }
        }).start();
    }
}
