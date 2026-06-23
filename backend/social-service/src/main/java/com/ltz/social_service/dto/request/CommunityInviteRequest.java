package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CommunityInviteRequest {
    @NotNull
    private Long userId;
}
