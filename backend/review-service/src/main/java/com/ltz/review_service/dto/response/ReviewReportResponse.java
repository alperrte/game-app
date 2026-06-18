package com.ltz.review_service.dto.response;

import com.ltz.review_service.entity.ReviewReportStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ReviewReportResponse {

    private Long id;

    private Long reviewId;

    private Long reportedByUserId;

    private String reason;

    private ReviewReportStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime resolvedAt;
}