package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendshipResponse {

    private Long id;
    private Long userId;
    private Long friendUserId;
    private LocalDateTime createdAt;
}