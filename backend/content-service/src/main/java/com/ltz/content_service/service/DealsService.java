package com.ltz.content_service.service;

import com.ltz.content_service.dto.DealCampaignResponse;
import com.ltz.content_service.dto.DealCompareResponse;
import com.ltz.content_service.dto.PriceSnapshotResponse;
import com.ltz.content_service.entity.DealCampaign;
import com.ltz.content_service.entity.DealPriceSnapshot;
import com.ltz.content_service.entity.HistoricalLow;
import com.ltz.content_service.repository.DealCampaignRepository;
import com.ltz.content_service.repository.DealPriceSnapshotRepository;
import com.ltz.content_service.repository.HistoricalLowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealsService {

    private final DealCampaignRepository dealCampaignRepository;
    private final HistoricalLowRepository historicalLowRepository;
    private final DealPriceSnapshotRepository dealPriceSnapshotRepository;
    private final DealsQueryCache dealsQueryCache;
    private final ReactionsService reactionsService;

    public Page<DealCampaignResponse> getActiveDeals(Integer minDiscount, Pageable pageable, Long currentUserId) {
        List<DealCampaign> allDeals = (minDiscount != null && minDiscount > 0)
                ? dealsQueryCache.findByMinDiscount(minDiscount)
                : dealsQueryCache.findAllSortedByDiscount();

        // Bir oyun birden fazla mağazada indirimdeyse aynı isim tekrar tekrar listelenmesin diye
        // en yüksek indirimli satır tutulur (liste zaten indirime göre azalan sıralı).
        List<DealCampaign> deduped = allDeals.stream()
                .collect(Collectors.toMap(
                        DealCampaign::getGameTitle,
                        deal -> deal,
                        (keepFirst, ignored) -> keepFirst,
                        LinkedHashMap::new))
                .values().stream()
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), deduped.size());
        List<DealCampaignResponse> pageContent = start >= deduped.size()
                ? List.of()
                : deduped.subList(start, end).stream()
                        .map(deal -> mapToResponse(deal, currentUserId))
                        .collect(Collectors.toList());

        return new PageImpl<>(pageContent, pageable, deduped.size());
    }

    private DealCampaignResponse mapToResponse(DealCampaign deal, Long currentUserId) {
        DealCompareResponse.HistoricalLowDTO historicalLowDto = historicalLowRepository
                .findByGameTitleIgnoreCase(deal.getGameTitle())
                .map(low -> DealCompareResponse.HistoricalLowDTO.builder()
                        .lowestPrice(low.getLowestPrice())
                        .storeName(low.getStoreName())
                        .currency(low.getCurrency())
                        .recordedAt(low.getRecordedAt())
                        .build())
                .orElse(null);

        return DealCampaignResponse.builder()
                .id(deal.getId())
                .gameTitle(deal.getGameTitle())
                .storeName(deal.getStoreName())
                .dealUrl(deal.getDealUrl())
                .imageUrl(deal.getImageUrl())
                .originalPrice(deal.getOriginalPrice())
                .discountedPrice(deal.getDiscountedPrice())
                .discountPercent(deal.getDiscountPercent())
                .currency(deal.getCurrency())
                .steamDeckStatus(deal.getSteamDeckStatus())
                .isCrossPlay(deal.isCrossPlay())
                .isFree(deal.isFree())
                .endsAt(deal.getEndsAt())
                .metacriticScore(deal.getMetacriticScore())
                .steamRatingPercent(deal.getSteamRatingPercent())
                .lastUpdated(deal.getLastUpdated())
                .reactions(reactionsService.getReactionsSummary(deal.getId(), "CAMPAIGN"))
                .userReaction(reactionsService.getUserReaction(currentUserId, deal.getId(), "CAMPAIGN"))
                .historicalLow(historicalLowDto)
                .build();
    }

    public List<DealCompareResponse> searchAndCompareDeals(String title, Long currentUserId) {
        List<DealCampaign> campaigns = (title == null || title.trim().isBlank()) ? dealCampaignRepository.findAll()
                : dealCampaignRepository.findByGameTitleContainingIgnoreCase(title);

        if (campaigns.size() > 50) {
            campaigns = campaigns.subList(0, 50);
        }

        Map<String, List<DealCampaign>> campaignsByGame = campaigns.stream()
                .collect(Collectors.groupingBy(DealCampaign::getGameTitle));

        return campaignsByGame.entrySet().stream()
                .map(entry -> {
                    String gameTitle = entry.getKey();
                    List<DealCampaign> gameDeals = entry.getValue();

                    // Sort deals by discounted price ascending
                    gameDeals.sort(Comparator.comparing(DealCampaign::getDiscountedPrice));

                    // Get historical low for this game
                    Optional<HistoricalLow> lowOpt = historicalLowRepository.findByGameTitleIgnoreCase(gameTitle);
                    DealCompareResponse.HistoricalLowDTO lowDto = null;
                    if (lowOpt.isPresent()) {
                        HistoricalLow low = lowOpt.get();
                        lowDto = DealCompareResponse.HistoricalLowDTO.builder()
                                .lowestPrice(low.getLowestPrice())
                                .storeName(low.getStoreName())
                                .currency(low.getCurrency())
                                .recordedAt(low.getRecordedAt())
                                .build();
                    }

                    // Represent reactions using the cheapest campaign option
                    Long repCampaignId = gameDeals.isEmpty() ? null : gameDeals.get(0).getId();
                    Map<String, Long> reactions = Map.of();
                    String userReaction = null;
                    if (repCampaignId != null) {
                        reactions = reactionsService.getReactionsSummary(repCampaignId, "CAMPAIGN");
                        userReaction = reactionsService.getUserReaction(currentUserId, repCampaignId, "CAMPAIGN");
                    }

                    List<DealCompareResponse.StoreDealDTO> storeDeals = gameDeals.stream()
                            .map(d -> DealCompareResponse.StoreDealDTO.builder()
                                    .storeName(d.getStoreName())
                                    .dealUrl(d.getDealUrl())
                                    .imageUrl(d.getImageUrl())
                                    .originalPrice(d.getOriginalPrice())
                                    .discountedPrice(d.getDiscountedPrice())
                                    .discountPercent(d.getDiscountPercent())
                                    .currency(d.getCurrency())
                                    .steamDeckStatus(d.getSteamDeckStatus())
                                    .isCrossPlay(d.isCrossPlay())
                                    .isFree(d.isFree())
                                    .endsAt(d.getEndsAt())
                                    .build())
                            .collect(Collectors.toList());

                    return DealCompareResponse.builder()
                            .campaignId(repCampaignId)
                            .gameTitle(gameTitle)
                            .stores(storeDeals)
                            .historicalLow(lowDto)
                            .reactions(reactions)
                            .userReaction(userReaction)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<DealCampaignResponse> getFreeGames(Long currentUserId) {
        return dealsQueryCache.findFreeGames().stream()
                .map(deal -> mapToResponse(deal, currentUserId))
                .collect(Collectors.toList());
    }

    public List<PriceSnapshotResponse> getPriceHistory(String gameTitle) {
        List<DealPriceSnapshot> snapshots = dealPriceSnapshotRepository
                .findTop30ByGameTitleIgnoreCaseOrderByRecordedAtDesc(gameTitle);

        return snapshots.stream()
                .sorted(Comparator.comparing(DealPriceSnapshot::getRecordedAt))
                .map(snapshot -> PriceSnapshotResponse.builder()
                        .discountedPrice(snapshot.getDiscountedPrice())
                        .currency(snapshot.getCurrency())
                        .recordedAt(snapshot.getRecordedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
