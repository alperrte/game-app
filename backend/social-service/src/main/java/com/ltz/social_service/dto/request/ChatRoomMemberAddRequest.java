package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRoomMemberAddRequest {

    @NotNull(message = "User ID is required")
    private Long userId;
}
