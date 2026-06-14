package com.ltz.user_service.repository;

import com.ltz.user_service.entity.UserAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAuditLogRepository extends JpaRepository<UserAuditLog, Long> {
}
