package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.CommunityInvitationStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommunityInvitationResponse {
    private Long id;
    private Long communityId;
    private String communityName;
    private Long inviterUserId;
    private Long invitedUserId;
    private CommunityInvitationStatus status;
    private LocalDateTime createdAt;
}
