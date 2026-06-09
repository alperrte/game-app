package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BlockUserRequest {

    @NotNull(message = "Blocker user id is required")
    private Long blockerUserId;

    @NotNull(message = "Blocked user id is required")
    private Long blockedUserId;
}