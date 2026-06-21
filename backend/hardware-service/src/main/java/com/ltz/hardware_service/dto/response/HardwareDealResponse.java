package com.ltz.hardware_service.dto.response;

import com.ltz.hardware_service.entity.enums.DealSourceType;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class HardwareDealResponse {

    private Long id;

    private HardwareComponentSummaryResponse component;

    private String title;

    private String storeName;

    private BigDecimal oldPrice;

    private BigDecimal newPrice;

    private String currency;

    private BigDecimal discountPercentage;

    private String dealUrl;

    private DealSourceType sourceType;

    private Boolean active;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}