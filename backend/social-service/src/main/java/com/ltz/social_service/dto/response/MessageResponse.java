package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.MediaAssetType;
import com.ltz.social_service.enums.MessageType;
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
    private MessageType messageType;
    private String mediaUrl;
    private MediaAssetType mediaType;
    private List<MessageReactionResponse> reactions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
