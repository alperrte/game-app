package com.ltz.hardware_service.dto.request;

import com.ltz.hardware_service.entity.enums.GraphicsPreset;
import com.ltz.hardware_service.entity.enums.UpscalingType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GamePerformanceReportCreateRequest {

    @NotNull(message = "Oyun id boş olamaz.")
    private Long gameId;

    private Long cpuComponentId;

    private Long gpuComponentId;

    @Min(value = 1, message = "RAM miktarı en az 1 GB olmalıdır.")
    private Integer ramGb;

    @Size(max = 50, message = "Çözünürlük en fazla 50 karakter olabilir.")
    private String resolution;

    private GraphicsPreset graphicsPreset;

    @Min(value = 0, message = "Ortalama FPS negatif olamaz.")
    private Integer averageFps;

    @Min(value = 0, message = "Minimum FPS negatif olamaz.")
    private Integer minimumFps;

    @Min(value = 0, message = "Maksimum FPS negatif olamaz.")
    private Integer maximumFps;

    private Boolean rayTracingEnabled;

    private UpscalingType upscalingType;

    @Size(max = 100, message = "Driver versiyonu en fazla 100 karakter olabilir.")
    private String driverVersion;

    private String notes;
}