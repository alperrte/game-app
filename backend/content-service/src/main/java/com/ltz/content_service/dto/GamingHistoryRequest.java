package com.ltz.content_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GamingHistoryRequest {
    @Min(1)
    @Max(31)
    private int eventDay;

    @Min(1)
    @Max(12)
    private int eventMonth;

    @Min(1)
    private int eventYear;

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    private String imageUrl;
}
