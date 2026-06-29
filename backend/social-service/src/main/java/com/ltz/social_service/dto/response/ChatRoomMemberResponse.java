package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.ChatRoomMemberRole;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatRoomMemberResponse {

    private Long userId;
    private boolean creator;
    private ChatRoomMemberRole role;
    private LocalDateTime joinedAt;
}
