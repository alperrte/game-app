package com.ltz.content_service.service.scheduler;

import com.ltz.content_service.entity.DealCampaign;
import com.ltz.content_service.entity.HistoricalLow;
import com.ltz.content_service.repository.DealCampaignRepository;
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

            log.info("Completed deals fetch job.");
        } catch (Exception e) {
            log.error("Error fetching deals: ", e);
        }
    }
}
