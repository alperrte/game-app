package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRoomOwnershipTransferRequest {

    @NotNull(message = "New owner user ID is required")
    private Long userId;
}
