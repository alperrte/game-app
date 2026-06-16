package com.ltz.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ConnectedAccountRequest {

    @NotBlank(message = "Platform name is required")
    @Size(max = 50, message = "Platform name cannot exceed 50 characters")
    private String platformName;

    @NotBlank(message = "Platform user ID is required")
    @Size(max = 100, message = "Platform user ID cannot exceed 100 characters")
    private String platformUserId;

    @Size(max = 100, message = "Platform username cannot exceed 100 characters")
    private String platformUsername;
}
