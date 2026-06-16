package com.ltz.user_service.service;

import com.ltz.user_service.dto.response.AuditLogResponse;
import com.ltz.user_service.entity.UserAuditLog;
import com.ltz.user_service.repository.UserAuditLogRepository;
import com.ltz.user_service.util.AuditLogMapper;
import com.ltz.user_service.util.ClientRequestContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private final UserAuditLogRepository auditLogRepository;

    public AuditLogService(UserAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async
    @Transactional
    public void log(String userId, String action, String details, ClientRequestContext context) {
        UserAuditLog log = UserAuditLog.builder()
                .userId(userId)
                .action(action)
                .details(details)
                .ipAddress(context != null ? context.ipAddress() : null)
                .userAgent(context != null ? context.userAgent() : null)
                .deviceInfo(context != null ? context.deviceInfo() : null)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<UserAuditLog> getAuditLogs(String userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogResponses(String userId, String viewerRole) {
        boolean includeSensitive = AuditLogMapper.isPrivilegedRole(viewerRole);
        return getAuditLogs(userId).stream()
                .map(log -> AuditLogMapper.toResponse(log, includeSensitive))
                .toList();
    }
}
