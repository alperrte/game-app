package com.ltz.content_service.service.scheduler;

import com.ltz.content_service.model.entity.DealCampaign;
import com.ltz.content_service.model.entity.HistoricalLow;
import com.ltz.content_service.repository.DealCampaignRepository;
import com.ltz.content_service.repository.HistoricalLowRepository;
import com.ltz.content_service.service.client.CheapSharkClient;
import com.ltz.content_service.service.client.SteamClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final CheapSharkClient cheapSharkClient;
    private final SteamClient steamClient;

    private static final Map<String, String> STORES_MAP = Map.of(
            "1", "Steam",
            "2", "GamersGate",
            "3", "GreenManGaming",
            "7", "GOG",
            "11", "Epic Games Store",
            "25", "Humble Store"
    );

    @Scheduled(cron = "0 0 */6 * * *")
    public void fetchDeals() {
        log.info("Starting deals fetch job...");
        try {
            List<Map<String, Object>> deals = cheapSharkClient.getDeals().block();
            if (deals == null || deals.isEmpty()) {
                log.warn("No deals returned from CheapShark API");
                return;
            }

            Flux.fromIterable(deals)
                    .flatMap(deal -> {
                        String storeId = (String) deal.get("storeID");
                        String storeName = STORES_MAP.getOrDefault(storeId, "Other Store");
                        String steamAppIDStr = (String) deal.get("steamAppID");

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

                        return statusMono.map(status -> Map.of("deal", deal, "steamDeckStatus", status));
                    }, 10) // Process up to 10 lookups concurrently
                    .doOnNext(result -> {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> deal = (Map<String, Object>) result.get("deal");
                        String steamDeckStatus = (String) result.get("steamDeckStatus");

                        String title = (String) deal.get("title");
                        String storeId = (String) deal.get("storeID");
                        String storeName = STORES_MAP.getOrDefault(storeId, "Other Store");

                        String dealID = (String) deal.get("dealID");
                        String dealUrl = "https://www.cheapshark.com/redirect?dealID=" + dealID;

                        BigDecimal normalPrice = new BigDecimal((String) deal.get("normalPrice"));
                        BigDecimal salePrice = new BigDecimal((String) deal.get("salePrice"));
                        Integer discountPercent = (int) Math.round(Double.parseDouble((String) deal.get("savings")));

                        String image = (String) deal.get("thumb");

                        // Parse Metacritic score
                        Integer metacriticScore = null;
                        try {
                            String mc = (String) deal.get("metacriticScore");
                            if (mc != null && !mc.isEmpty() && !"0".equals(mc)) {
                                metacriticScore = Integer.parseInt(mc);
                            }
                        } catch (Exception e) {
                            // ignore
                        }

                        // Parse Steam Rating
                        Integer steamRatingPercent = null;
                        try {
                            String sr = (String) deal.get("steamRatingPercent");
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

            log.info("Completed deals fetch job.");
        } catch (Exception e) {
            log.error("Error fetching deals: ", e);
        }
        
        // Populate Console Deals
        populateConsoleDeals();
    }

    private void populateConsoleDeals() {
        log.info("Generating simulated console deals for PSN and Xbox stores...");
        try {
            // PlayStation Store Campaigns
            createConsoleDeal("Marvel's Spider-Man 2", "PlayStation Store",
                    "https://store.playstation.com/concept/10002456",
                    "https://image.api.playstation.com/vulcan/ap/rnd/202306/1219/60de327d4d830573b218aeab95aaafcc246c0a0c4f3460b5.png",
                    new BigDecimal("69.99"), new BigDecimal("49.99"), 28, "VERIFIED", false, 90, 92);

            createConsoleDeal("The Last of Us Part I", "PlayStation Store",
                    "https://store.playstation.com/concept/10004406",
                    "https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/eE7Dx27rWl37r24u35B07g94.png",
                    new BigDecimal("69.99"), new BigDecimal("39.99"), 42, "VERIFIED", false, 89, 94);

            // Xbox Store Campaigns
            createConsoleDeal("Halo Infinite", "Xbox Store",
                    "https://www.xbox.com/games/store/halo-infinite-campaign/9np1p1w0dcc1",
                    "https://store-images.s-microsoft.com/image/apps.50670.13727856755392170.62ec2f9c-7e6b-4e6f-ad86-cf57e62a8069.9575e9e0-88cb-402a-a92c-56bfb0a7c493",
                    new BigDecimal("59.99"), new BigDecimal("19.99"), 66, "VERIFIED", true, 87, 85);

            createConsoleDeal("Forza Horizon 5", "Xbox Store",
                    "https://www.xbox.com/games/store/forza-horizon-5-standard-edition/9nkx70bbcd18",
                    "https://store-images.s-microsoft.com/image/apps.13965.13781254394801997.7d76ee73-ee0b-46bf-ad90-256df2e1f422.39b6b7cf-a511-4045-bf27-142273be81a9",
                    new BigDecimal("59.99"), new BigDecimal("29.99"), 50, "VERIFIED", true, 92, 91);
        } catch (Exception e) {
            log.error("Failed to populate console deals: ", e);
        }
    }

    private void createConsoleDeal(String title, String storeName, String url, String img, BigDecimal original, BigDecimal discounted, int pct, 
                                   String steamDeck, boolean crossPlay, Integer metacritic, Integer steamRating) {
        try {
            Optional<DealCampaign> existingDeal = dealCampaignRepository.findByGameTitleAndStoreName(title, storeName);
            DealCampaign dealCampaign;
            if (existingDeal.isPresent()) {
                dealCampaign = existingDeal.get();
                dealCampaign.setDealUrl(url);
                dealCampaign.setImageUrl(img);
                dealCampaign.setOriginalPrice(original);
                dealCampaign.setDiscountedPrice(discounted);
                dealCampaign.setDiscountPercent(pct);
                dealCampaign.setSteamDeckStatus(steamDeck);
                dealCampaign.setMetacriticScore(metacritic);
                dealCampaign.setSteamRatingPercent(steamRating);
                dealCampaign.setLastUpdated(LocalDateTime.now());
            } else {
                dealCampaign = DealCampaign.builder()
                        .gameTitle(title)
                        .storeName(storeName)
                        .dealUrl(url)
                        .imageUrl(img)
                        .originalPrice(original)
                        .discountedPrice(discounted)
                        .discountPercent(pct)
                        .steamDeckStatus(steamDeck)
                        .isCrossPlay(crossPlay)
                        .metacriticScore(metacritic)
                        .steamRatingPercent(steamRating)
                        .lastUpdated(LocalDateTime.now())
                        .build();
            }
            dealCampaignRepository.save(dealCampaign);

            // Also check and update HistoricalLow
            Optional<HistoricalLow> existingLow = historicalLowRepository.findByGameTitleIgnoreCase(title);
            if (existingLow.isPresent()) {
                HistoricalLow low = existingLow.get();
                if (discounted.compareTo(low.getLowestPrice()) < 0) {
                    low.setLowestPrice(discounted);
                    low.setStoreName(storeName);
                    low.setRecordedAt(LocalDateTime.now());
                    historicalLowRepository.save(low);
                }
            } else {
                HistoricalLow low = HistoricalLow.builder()
                        .gameTitle(title)
                        .lowestPrice(discounted)
                        .storeName(storeName)
                        .recordedAt(LocalDateTime.now())
                        .build();
                historicalLowRepository.save(low);
            }
        } catch (Exception innerEx) {
            log.error("Error saving console campaign for game {}: ", title, innerEx);
        }
    }
}
