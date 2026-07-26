package com.ltz.content_service.dto;

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
public class SpotlightBannerRequest {
    @NotBlank
    private String title;

    private String subtitle;

    @NotBlank
    private String imageUrl;

    @NotBlank
    private String targetUrl;

    @Min(0)
    private int displayOrder;

    private boolean active;
}
