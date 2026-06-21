package com.ltz.content_service.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpotlightBannerRequest {
    private String title;
    private String subtitle;
    private String imageUrl;
    private String targetUrl;
    private int displayOrder;
    private boolean active;
}
