package com.ltz.user_service.util;

import com.ltz.user_service.dto.response.AuditLogResponse;
import com.ltz.user_service.entity.UserAuditLog;

public final class AuditLogMapper {

    private AuditLogMapper() {
    }

    public static AuditLogResponse toResponse(UserAuditLog log, boolean includeSensitiveDetails) {
        AuditLogResponse.AuditLogResponseBuilder builder = AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt());

        if (includeSensitiveDetails) {
            builder
                    .ipAddress(log.getIpAddress())
                    .userAgent(log.getUserAgent())
                    .deviceInfo(log.getDeviceInfo());
        }

        return builder.build();
    }

    public static boolean isPrivilegedRole(String role) {
        if (role == null || role.isBlank()) {
            return false;
        }

        String normalized = role.toUpperCase().replace("ROLE_", "");
        return "ADMIN".equals(normalized) || "MODERATOR".equals(normalized);
    }
}
