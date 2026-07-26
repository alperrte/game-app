package com.ltz.user_service.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserProfileCommendationsSummary {
    private long totalReviews;
    private long friendlyCount;
    private long leaderCount;
    private long aimGodCount;
    private long tacticianCount;
}
