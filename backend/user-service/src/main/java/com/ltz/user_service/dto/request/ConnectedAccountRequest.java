package com.ltz.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConnectedAccountRequest {

    @NotBlank(message = "Platform name is required")
    private String platformName;

    @NotBlank(message = "Platform user ID is required")
    private String platformUserId;

    private String platformUsername;
}
