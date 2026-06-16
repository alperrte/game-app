package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class MessageResponse {

    private Long id;
    private Long chatRoomId;
    private Long senderUserId;
    private String content;
    private Boolean isRead;
    private LocalDateTime readAt;
    private Boolean isDeleted;
    private Long replyToMessageId;
    private Long replyToSenderUserId;
    private String replyToContent;
    private List<MessageReactionResponse> reactions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}