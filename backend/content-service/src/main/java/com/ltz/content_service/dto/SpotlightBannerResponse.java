package com.ltz.content_service.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SpotlightBannerResponse {
    private Long id;
    private String title;
    private String subtitle;
    private String imageUrl;
    private String targetUrl;
    private int displayOrder;
    private boolean active;
}
