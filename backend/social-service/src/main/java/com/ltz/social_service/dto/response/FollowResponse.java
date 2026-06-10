package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FollowResponse {

    private Long id;
    private Long followerUserId;
    private Long followingUserId;
    private LocalDateTime createdAt;
}