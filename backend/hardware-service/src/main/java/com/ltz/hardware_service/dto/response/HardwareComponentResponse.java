package com.ltz.hardware_service.dto.response;

import com.ltz.hardware_service.entity.enums.ComponentCategory;
import com.ltz.hardware_service.entity.enums.ComponentType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class HardwareComponentResponse {

    private Long id;

    private ComponentType componentType;

    private ComponentCategory category;

    private Long brandId;

    private String brandName;

    private String seriesName;

    private String modelName;

    private String normalizedName;

    private String aliases;

    private String imageUrl;

    private Boolean verified;

    private Long createdByUserId;

    private Integer vramGb;

    private Integer coreCount;

    private Integer threadCount;

    private Integer memoryGb;

    private Integer storageCapacityGb;

    private String extraSpecs;

    private Boolean active;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}