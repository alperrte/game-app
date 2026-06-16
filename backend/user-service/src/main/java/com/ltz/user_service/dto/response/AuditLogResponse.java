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
public class AuditLogResponse {
    private Long id;
    private String action;
    private String details;
    private LocalDateTime createdAt;
    private String ipAddress;
    private String userAgent;
    private String deviceInfo;
}
