package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageCreateRequest {

    @NotNull(message = "Chat room id is required")
    private Long chatRoomId;

    private Long senderUserId;

    @NotBlank(message = "Message content is required")
    @Size(max = 1000, message = "Message content can be at most 1000 characters")
    private String content;

    private Long replyToMessageId;
}
