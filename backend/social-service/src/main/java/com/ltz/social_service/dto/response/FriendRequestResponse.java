package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.FriendRequestStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FriendRequestResponse {

    private Long id;
    private Long senderUserId;
    private Long receiverUserId;
    private FriendRequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}