package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.CommunityMemberRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommunityMemberResponse {
    private Long userId;
    private CommunityMemberRole role;
    private LocalDateTime joinedAt;
}
