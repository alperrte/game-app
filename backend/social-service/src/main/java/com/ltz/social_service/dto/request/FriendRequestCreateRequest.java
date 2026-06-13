package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FriendRequestCreateRequest {

    private Long senderUserId;

    @NotNull(message = "Receiver user id is required")
    private Long receiverUserId;
}
