package com.ltz.hardware_service.dto.response;

import com.ltz.hardware_service.entity.enums.GraphicsPreset;
import com.ltz.hardware_service.entity.enums.UpscalingType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class GamePerformanceReportResponse {

    private Long id;

    private Long userId;

    private Long gameId;

    private Long reviewId;

    private HardwareComponentSummaryResponse cpuComponent;

    private HardwareComponentSummaryResponse gpuComponent;

    private Integer ramGb;

    private String resolution;

    private GraphicsPreset graphicsPreset;

    private Integer averageFps;

    private Integer minimumFps;

    private Integer maximumFps;

    private Boolean rayTracingEnabled;

    private UpscalingType upscalingType;

    private String driverVersion;

    private String notes;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}