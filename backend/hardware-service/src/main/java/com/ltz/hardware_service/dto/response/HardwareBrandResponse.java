package com.ltz.hardware_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class HardwareBrandResponse {

    private Long id;

    private String name;

    private String logoUrl;

    private String websiteUrl;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}