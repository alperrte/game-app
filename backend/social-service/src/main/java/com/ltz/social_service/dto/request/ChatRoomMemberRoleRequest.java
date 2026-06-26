package com.ltz.social_service.dto.request;

import com.ltz.social_service.enums.ChatRoomMemberRole;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChatRoomMemberRoleRequest {

    @NotNull(message = "Member role is required")
    private ChatRoomMemberRole role;
}
