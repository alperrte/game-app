package com.ltz.social_service.dto.response;

import com.ltz.social_service.enums.CommunityEventStatus;
import com.ltz.social_service.enums.CommunityEventType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommunityEventResponse {
    private Long id;
    private Long communityId;
    private String communityName;
    private Long organizerUserId;
    private String title;
    private String description;
    private CommunityEventType eventType;
    private CommunityEventStatus status;
    private String location;
    private String imageUrl;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private Integer capacity;
    private long participantCount;
    private boolean joinedByCurrentUser;
    private LocalDateTime createdAt;
}
