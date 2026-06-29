package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.CommunityVisibility;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommunityResponse {
    private Long id;
    private Long ownerUserId;
    private String name;
    private String description;
    private String category;
    private String imageUrl;
    private CommunityVisibility visibility;
    private boolean membersVisible;
    private long memberCount;
    private boolean joinedByCurrentUser;
    private boolean ownedByCurrentUser;
    private LocalDateTime createdAt;
}
