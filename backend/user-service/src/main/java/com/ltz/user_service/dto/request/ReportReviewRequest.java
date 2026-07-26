package com.ltz.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReportReviewRequest {

    @NotBlank(message = "Report reason is required")
    @Size(max = 255, message = "Report reason cannot exceed 255 characters")
    private String reason;
}
