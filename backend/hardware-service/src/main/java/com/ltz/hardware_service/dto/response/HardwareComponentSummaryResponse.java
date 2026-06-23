package com.ltz.hardware_service.dto.response;

import com.ltz.hardware_service.entity.enums.ComponentCategory;
import com.ltz.hardware_service.entity.enums.ComponentType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class HardwareComponentSummaryResponse {

    private Long id;

    private ComponentType componentType;

    private ComponentCategory category;

    private String brandName;

    private String seriesName;

    private String modelName;

    private String imageUrl;

    private Boolean verified;
}