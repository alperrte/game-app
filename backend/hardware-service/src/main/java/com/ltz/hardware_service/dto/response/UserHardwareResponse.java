package com.ltz.hardware_service.dto.response;

import com.ltz.hardware_service.entity.enums.HardwareVisibility;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserHardwareResponse {

    private Long id;

    private Long userId;

    private HardwareComponentSummaryResponse cpuComponent;

    private HardwareComponentSummaryResponse gpuComponent;

    private Integer ramGb;

    private String ramType;

    private Integer storageGb;

    private String storageType;

    private HardwareComponentSummaryResponse motherboardComponent;

    private HardwareComponentSummaryResponse monitorComponent;

    private HardwareComponentSummaryResponse keyboardComponent;

    private HardwareComponentSummaryResponse mouseComponent;

    private HardwareComponentSummaryResponse headsetComponent;

    private String operatingSystem;

    private String monitorResolution;

    private Integer monitorRefreshRate;

    private HardwareVisibility visibility;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}