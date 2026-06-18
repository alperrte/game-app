package com.ltz.review_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewReportRequest {

    @NotBlank(message = "Report reason is required.")
    @Size(max = 500, message = "Report reason can be at most 500 characters.")
    private String reason;
}
