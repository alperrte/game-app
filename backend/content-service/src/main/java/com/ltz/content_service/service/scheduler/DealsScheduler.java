package com.ltz.content_service.service.scheduler;

import com.ltz.content_service.entity.DealCampaign;
import com.ltz.content_service.entity.DealPriceSnapshot;
import com.ltz.content_service.entity.HistoricalLow;
import com.ltz.content_service.repository.DealCampaignRepository;
import com.ltz.content_service.repository.DealPriceSnapshotRepository;
import com.ltz.content_service.repository.HistoricalLowRepository;
import com.ltz.content_service.service.client.CheapSharkClient;
import com.ltz.content_service.service.client.SteamClient;
import com.ltz.content_service.service.client.dto.CheapSharkDeal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class DealsScheduler {

    private final DealCampaignRepository dealCampaignRepository;
    private final HistoricalLowRepository historicalLowRepository;
    private final DealPriceSnapshotRepository dealPriceSnapshotRepository;
    private final CheapSharkClient cheapSharkClient;
    private final SteamClient steamClient;

    private static final Map<String, String> STORES_MAP = Map.ofEntries(
            Map.entry("1", "Steam"),
            Map.entry("2", "GamersGate"),
            Map.entry("3", "GreenManGaming"),
            Map.entry("4", "Amazon"),
            Map.entry("5", "GameStop"),
            Map.entry("6", "Direct2Drive"),
            Map.entry("7", "GOG"),
            Map.entry("8", "Origin"),
            Map.entry("9", "Get Games"),
            Map.entry("10", "Shiny Loot"),
            Map.entry("11", "Humble Store"),
            Map.entry("12", "Desura"),
            Map.entry("13", "Uplay"),
            Map.entry("14", "IndieGameStand"),
            Map.entry("15", "Fanatical"),
            Map.entry("16", "Gamesrocket"),
            Map.entry("17", "Games Republic"),
            Map.entry("18", "SilaGames"),
            Map.entry("19", "Playfield"),
            Map.entry("20", "ImperialGames"),
            Map.entry("21", "WinGameStore"),
            Map.entry("22", "FunStockDigital"),
            Map.entry("23", "GameBillet"),
            Map.entry("24", "Voidu"),
            Map.entry("25", "Epic Games Store"),
            Map.entry("26", "Razer Game Store"),
            Map.entry("27", "Gamesplanet"),
            Map.entry("28", "Gamesload"),
            Map.entry("29", "2Game"),
            Map.entry("30", "IndieGala"),
            Map.entry("31", "Blizzard Shop"),
            Map.entry("32", "AllYouPlay"),
            Map.entry("33", "DLGamer"),
            Map.entry("34", "Noctre"),
            Map.entry("35", "DreamGame")
    );

    private record DealWithStatus(CheapSharkDeal deal, String steamDeckStatus) {
    }

    @Scheduled(cron = "0 0 */6 * * *")
    @CacheEvict(value = "deals", allEntries = true)
    public void fetchDeals() {
        log.info("Starting deals fetch job...");
        try {
            List<CheapSharkDeal> deals = cheapSharkClient.getDeals().block();
            if (deals == null || deals.isEmpty()) {
                log.warn("No deals returned from CheapShark API");
                return;
            }

            Flux.fromIterable(deals)
                    .flatMap(deal -> {
                        String storeName = STORES_MAP.getOrDefault(deal.storeId(), "Other Store");
                        String steamAppIDStr = deal.steamAppId();

                        Mono<String> statusMono;
                        if (storeName.equalsIgnoreCase("Steam") && steamAppIDStr != null && !steamAppIDStr.isEmpty() && !"0".equals(steamAppIDStr)) {
                            try {
                                long appId = Long.parseLong(steamAppIDStr);
                                statusMono = steamClient.getProtonDbCompatibility(appId)
                                        .onErrorReturn("VERIFIED")
                                        .defaultIfEmpty("VERIFIED");
                            } catch (Exception ex) {
                                statusMono = Mono.just("VERIFIED");
                            }
                        } else {
                            statusMono = Mono.just("VERIFIED");
                        }

                        return statusMono.map(status -> new DealWithStatus(deal, status));
                    }, 10) // Process up to 10 lookups concurrently
                    .doOnNext(result -> {
                        CheapSharkDeal deal = result.deal();
                        String steamDeckStatus = result.steamDeckStatus();

                        String title = deal.title();
                        String storeName = STORES_MAP.getOrDefault(deal.storeId(), "Other Store");

                        String dealUrl = "https://www.cheapshark.com/redirect?dealID=" + deal.dealId();

                        BigDecimal normalPrice = new BigDecimal(deal.normalPrice());
                        BigDecimal salePrice = new BigDecimal(deal.salePrice());
                        Integer discountPercent = (int) Math.round(Double.parseDouble(deal.savings()));

                        String image = deal.thumb();
                        if (image != null && image.contains("store-images.s-microsoft.com")) {
                            image = null;
                        }

                        // Parse Metacritic score
                        Integer metacriticScore = null;
                        try {
                            String mc = deal.metacriticScore();
                            if (mc != null && !mc.isEmpty() && !"0".equals(mc)) {
                                metacriticScore = Integer.parseInt(mc);
                            }
                        } catch (Exception e) {
                            // ignore
                        }

                        // Parse Steam Rating
                        Integer steamRatingPercent = null;
                        try {
                            String sr = deal.steamRatingPercent();
                            if (sr != null && !sr.isEmpty() && !"0".equals(sr)) {
                                steamRatingPercent = Integer.parseInt(sr);
                            }
                        } catch (Exception e) {
                            // ignore
                        }

                        boolean isCrossPlay = storeName.equalsIgnoreCase("Steam") || storeName.equalsIgnoreCase("Epic Games Store");

                        try {
                            Optional<DealCampaign> existingDeal = dealCampaignRepository.findByGameTitleAndStoreName(title, storeName);
                            DealCampaign dealCampaign;
                            if (existingDeal.isPresent()) {
                                dealCampaign = existingDeal.get();
                                dealCampaign.setDealUrl(dealUrl);
                                dealCampaign.setImageUrl(image);
                                dealCampaign.setOriginalPrice(normalPrice);
                                dealCampaign.setDiscountedPrice(salePrice);
                                dealCampaign.setDiscountPercent(discountPercent);
                                dealCampaign.setSteamDeckStatus(steamDeckStatus);
                                dealCampaign.setMetacriticScore(metacriticScore);
                                dealCampaign.setSteamRatingPercent(steamRatingPercent);
                                dealCampaign.setLastUpdated(LocalDateTime.now());
                            } else {
                                dealCampaign = DealCampaign.builder()
                                        .gameTitle(title)
                                        .storeName(storeName)
                                        .dealUrl(dealUrl)
                                        .imageUrl(image)
                                        .originalPrice(normalPrice)
                                        .discountedPrice(salePrice)
                                        .discountPercent(discountPercent)
                                        .steamDeckStatus(steamDeckStatus)
                                        .isCrossPlay(isCrossPlay)
                                        .metacriticScore(metacriticScore)
                                        .steamRatingPercent(steamRatingPercent)
                                        .lastUpdated(LocalDateTime.now())
                                        .build();
                            }
                            dealCampaignRepository.save(dealCampaign);

                            Optional<HistoricalLow> existingLow = historicalLowRepository.findByGameTitleIgnoreCase(title);
                            if (existingLow.isPresent()) {
                                HistoricalLow low = existingLow.get();
                                if (salePrice.compareTo(low.getLowestPrice()) < 0) {
                                    low.setLowestPrice(salePrice);
                                    low.setStoreName(storeName);
                                    low.setRecordedAt(LocalDateTime.now());
                                    historicalLowRepository.save(low);
                                    log.info("New Historical Low detected for {}: {} on {}", title, salePrice, storeName);
                                }
                            } else {
                                HistoricalLow low = HistoricalLow.builder()
                                        .gameTitle(title)
                                        .lowestPrice(salePrice)
                                        .storeName(storeName)
                                        .recordedAt(LocalDateTime.now())
                                        .build();
                                historicalLowRepository.save(low);
                            }
                        } catch (Exception innerEx) {
                            log.error("Error saving campaign for game {}: ", title, innerEx);
                        }
                    })
                    .then()
                    .block();

            captureDailyPriceSnapshots();

            log.info("Completed deals fetch job.");
        } catch (Exception e) {
            log.error("Error fetching deals: ", e);
        }
    }

    private void captureDailyPriceSnapshots() {
        try {
            Map<String, DealCampaign> cheapestPerGame = new java.util.LinkedHashMap<>();
            for (DealCampaign deal : dealCampaignRepository.findAll()) {
                DealCampaign current = cheapestPerGame.get(deal.getGameTitle());
                if (current == null || deal.getDiscountedPrice().compareTo(current.getDiscountedPrice()) < 0) {
                    cheapestPerGame.put(deal.getGameTitle(), deal);
                }
            }

            LocalDateTime now = LocalDateTime.now();
            for (DealCampaign cheapest : cheapestPerGame.values()) {
                DealPriceSnapshot snapshot = DealPriceSnapshot.builder()
                        .gameTitle(cheapest.getGameTitle())
                        .discountedPrice(cheapest.getDiscountedPrice())
                        .currency(cheapest.getCurrency())
                        .recordedAt(now)
                        .build();
                dealPriceSnapshotRepository.save(snapshot);
            }
            log.info("Captured {} price snapshots.", cheapestPerGame.size());
        } catch (Exception e) {
            log.error("Failed to capture price snapshots: ", e);
        }
    }
}
