package com.ltz.content_service.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PriceSnapshotResponse {
    private BigDecimal discountedPrice;
    private String currency;
    private LocalDateTime recordedAt;
}
