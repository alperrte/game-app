package com.ltz.social_service.dto.request;

import com.ltz.social_service.enums.ChatRoomType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRoomCreateRequest {

    @Size(max = 100, message = "Room name can be at most 100 characters")
    private String roomName;

    @NotNull(message = "Room type is required")
    private ChatRoomType roomType;

    @NotNull(message = "Created by user id is required")
    private Long createdByUserId;
}