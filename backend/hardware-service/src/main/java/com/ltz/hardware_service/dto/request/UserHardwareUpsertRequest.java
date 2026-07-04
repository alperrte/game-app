package com.ltz.hardware_service.dto.request;

import com.ltz.hardware_service.entity.enums.HardwareVisibility;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserHardwareUpsertRequest {

    private Long cpuComponentId;

    private Long gpuComponentId;

    @Min(value = 1, message = "RAM miktarı en az 1 GB olmalıdır.")
    private Integer ramGb;

    @Size(max = 50, message = "RAM tipi en fazla 50 karakter olabilir.")
    private String ramType;

    @Min(value = 1, message = "Depolama miktarı en az 1 GB olmalıdır.")
    private Integer storageGb;

    @Size(max = 50, message = "Depolama tipi en fazla 50 karakter olabilir.")
    private String storageType;

    private Long motherboardComponentId;

    private Long monitorComponentId;

    private Long keyboardComponentId;

    private Long mouseComponentId;

    private Long headsetComponentId;

    @Size(max = 150, message = "İşletim sistemi en fazla 150 karakter olabilir.")
    private String operatingSystem;

    @Size(max = 50, message = "Çözünürlük en fazla 50 karakter olabilir.")
    private String monitorResolution;

    @Min(value = 1, message = "Monitör yenileme hızı en az 1 Hz olmalıdır.")
    private Integer monitorRefreshRate;

    @Size(max = 500, message = "Rig görseli URL en fazla 500 karakter olabilir.")
    private String rigImageUrl;

    private HardwareVisibility visibility;
}
