package com.ltz.review_service.dto.request;

import com.ltz.review_service.entity.ReviewReportStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateReviewReportStatusRequest {

    @NotNull(message = "Rapor durumu boş olamaz.")
    private ReviewReportStatus status;
}