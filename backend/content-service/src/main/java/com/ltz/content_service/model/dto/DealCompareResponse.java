package com.ltz.content_service.model.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class DealCompareResponse {
    private String gameTitle;
    private List<StoreDealDTO> stores;
    private HistoricalLowDTO historicalLow;
    private Map<String, Long> reactions;
    private String userReaction;

    @Data
    @Builder
    public static class StoreDealDTO {
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
    }

    @Data
    @Builder
    public static class HistoricalLowDTO {
        private BigDecimal lowestPrice;
        private String storeName;
        private String currency;
        private LocalDateTime recordedAt;
    }
}
