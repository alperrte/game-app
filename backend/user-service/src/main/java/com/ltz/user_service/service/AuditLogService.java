package com.ltz.user_service.service;

import com.ltz.user_service.entity.UserAuditLog;
import com.ltz.user_service.repository.UserAuditLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * 📊 AuditLogService
 * 
 * Kullanıcının gerçekleştirdiği kritik güvenlik ve profil işlemlerini veritabanına
 * asenkron (@Async) olarak yazar. Böylece loglama işlemleri ana HTTP thread'ini
 * bloklamaz ve performansa etki etmez.
 */
@Service
@Slf4j
public class AuditLogService {

    private final UserAuditLogRepository auditLogRepository;

    public AuditLogService(UserAuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Kritik kullanıcı işlemlerini asenkron olarak kaydeder.
     */
    @Async
    public void log(String userId, String action, String details, String ipAddress) {
        try {
            UserAuditLog auditLog = UserAuditLog.builder()
                    .userId(userId)
                    .action(action)
                    .details(details)
                    .ipAddress(ipAddress)
                    .build();
            
            auditLogRepository.save(auditLog);
            log.info("Audit log successfully written asynchronously for user: {}, action: {}", userId, action);
        } catch (Exception e) {
            log.error("Failed to write asynchronous audit log for user: " + userId, e);
        }
    }
}
