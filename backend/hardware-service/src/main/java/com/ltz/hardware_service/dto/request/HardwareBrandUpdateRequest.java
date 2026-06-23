package com.ltz.hardware_service.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HardwareBrandUpdateRequest {

    @Size(max = 100, message = "Marka adı en fazla 100 karakter olabilir.")
    private String name;

    @Size(max = 500, message = "Logo URL en fazla 500 karakter olabilir.")
    private String logoUrl;

    @Size(max = 500, message = "Website URL en fazla 500 karakter olabilir.")
    private String websiteUrl;

    private Boolean active;
}