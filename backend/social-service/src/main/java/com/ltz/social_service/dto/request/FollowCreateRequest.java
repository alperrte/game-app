package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FollowCreateRequest {

    private Long followerUserId;

    @NotNull(message = "Following user id is required")
    private Long followingUserId;
}
