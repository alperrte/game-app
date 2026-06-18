package com.ltz.content_service.service;

import com.ltz.content_service.model.dto.DealCompareResponse;
import com.ltz.content_service.model.entity.DealCampaign;
import com.ltz.content_service.model.entity.HistoricalLow;
import com.ltz.content_service.repository.DealCampaignRepository;
import com.ltz.content_service.repository.HistoricalLowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealsService {

    private final DealCampaignRepository dealCampaignRepository;
    private final HistoricalLowRepository historicalLowRepository;
    private final ReactionsService reactionsService;

    public Page<DealCampaign> getActiveDeals(Integer minDiscount, Pageable pageable) {
        if (minDiscount != null && minDiscount > 0) {
            return dealCampaignRepository.findByDiscountPercentGreaterThanEqual(minDiscount, pageable);
        }
        return dealCampaignRepository.findAll(pageable);
    }

    public List<DealCompareResponse> searchAndCompareDeals(String title, Long currentUserId) {
        List<DealCampaign> campaigns = (title == null || title.isBlank()) ?
                dealCampaignRepository.findAll() :
                dealCampaignRepository.findByGameTitleContainingIgnoreCase(title);

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
                            .gameTitle(gameTitle)
                            .stores(storeDeals)
                            .historicalLow(lowDto)
                            .reactions(reactions)
                            .userReaction(userReaction)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<DealCampaign> getFreeGames() {
        return dealCampaignRepository.findByIsFreeTrue();
    }
}
