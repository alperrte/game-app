package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DirectChatRoomCreateRequest {

    @NotNull(message = "Target user id is required")
    private Long targetUserId;

    @Size(max = 100, message = "Target username can be at most 100 characters")
    private String targetUsername;
}
