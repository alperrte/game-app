package com.ltz.hardware_service.dto.response;

import com.ltz.hardware_service.entity.enums.HardwareReviewType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class HardwareReviewResponse {

    private Long id;

    private Long userId;

    private HardwareComponentSummaryResponse component;

    private HardwareReviewType reviewType;

    private Integer rating;

    private String title;

    private String content;

    private String pros;

    private String cons;

    private Integer usageDurationMonths;

    private Boolean verifiedOwner;

    private Integer likeCount;

    private Integer reportCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}