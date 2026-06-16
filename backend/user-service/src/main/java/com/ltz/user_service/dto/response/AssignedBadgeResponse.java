package com.ltz.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignedBadgeResponse {
    private String badgeKey;
    private String label;
    private String assignedBy;
    private LocalDateTime assignedAt;
}
