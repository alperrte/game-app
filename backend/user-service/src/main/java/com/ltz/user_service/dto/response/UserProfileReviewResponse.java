package com.ltz.user_service.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileReviewResponse {
    private Long id;
    private String reviewerId;
    private String reviewerUsername;
    private String reviewerDisplayName;
    private String reviewerAvatarUrl;
    private String reviewedId;
    private String content;
    private boolean friendlyPoint;
    private boolean leaderPoint;
    private boolean aimGodPoint;
    private boolean tacticianPoint;
    private boolean reported;
    private String reportReason;
    private LocalDateTime createdAt;
}

