package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.ChatRoomType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatRoomResponse {

    private Long id;
    private String roomName;
    private ChatRoomType roomType;
    private Long createdByUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long otherParticipantUserId;
    private String lastMessageContent;
    private LocalDateTime lastMessageAt;
    private Long unreadCount;
}