package com.ltz.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignBadgeRequest {
    @NotBlank
    private String badgeKey;

    @NotBlank
    private String label;
}
