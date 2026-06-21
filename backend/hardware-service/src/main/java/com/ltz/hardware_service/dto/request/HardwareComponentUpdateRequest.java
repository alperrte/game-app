package com.ltz.hardware_service.dto.request;

import com.ltz.hardware_service.entity.enums.ComponentCategory;
import com.ltz.hardware_service.entity.enums.ComponentType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HardwareComponentUpdateRequest {

    private ComponentType componentType;

    private ComponentCategory category;

    private Long brandId;

    @Size(max = 150, message = "Seri adı en fazla 150 karakter olabilir.")
    private String seriesName;

    @Size(max = 200, message = "Model adı en fazla 200 karakter olabilir.")
    private String modelName;

    @Size(max = 250, message = "Normalize ad en fazla 250 karakter olabilir.")
    private String normalizedName;

    private String aliases;

    @Size(max = 500, message = "Görsel URL en fazla 500 karakter olabilir.")
    private String imageUrl;

    private Boolean verified;

    @Min(value = 0, message = "VRAM negatif olamaz.")
    private Integer vramGb;

    @Min(value = 0, message = "Çekirdek sayısı negatif olamaz.")
    private Integer coreCount;

    @Min(value = 0, message = "Thread sayısı negatif olamaz.")
    private Integer threadCount;

    @Min(value = 0, message = "Bellek miktarı negatif olamaz.")
    private Integer memoryGb;

    @Min(value = 0, message = "Depolama kapasitesi negatif olamaz.")
    private Integer storageCapacityGb;

    private String extraSpecs;

    private Boolean active;
}