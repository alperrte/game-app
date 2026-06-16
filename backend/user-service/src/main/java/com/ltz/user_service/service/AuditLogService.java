package com.ltz.user_service.service;

import com.ltz.user_service.entity.UserAuditLog;
import com.ltz.user_service.repository.UserAuditLogRepository;
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
    public void log(String userId, String action, String details, String ipAddress) {
        UserAuditLog log = UserAuditLog.builder()
                .userId(userId)
                .action(action)
                .details(details)
                .ipAddress(ipAddress)
                .build();
        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<UserAuditLog> getAuditLogs(String userId) {
        return auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}

