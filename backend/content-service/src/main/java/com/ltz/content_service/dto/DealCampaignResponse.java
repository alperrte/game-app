package com.ltz.content_service.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class DealCampaignResponse {
    private Long id;
    private String gameTitle;
    private String storeName;
    private String dealUrl;
    private String imageUrl;
    private BigDecimal originalPrice;
    private BigDecimal discountedPrice;
    private Integer discountPercent;
    private String currency;
    private String steamDeckStatus;
    private boolean isCrossPlay;
    private boolean isFree;
    private LocalDateTime endsAt;
    private Integer metacriticScore;
    private Integer steamRatingPercent;
    private LocalDateTime lastUpdated;
    private Map<String, Long> reactions;
    private String userReaction;
    private DealCompareResponse.HistoricalLowDTO historicalLow;
}
