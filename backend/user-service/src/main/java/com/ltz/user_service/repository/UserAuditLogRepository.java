package com.ltz.user_service.repository;

import com.ltz.user_service.entity.UserAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserAuditLogRepository extends JpaRepository<UserAuditLog, Long> {
    List<UserAuditLog> findByUserIdOrderByCreatedAtDesc(String userId);
}

