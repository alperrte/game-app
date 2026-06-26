package com.ltz.user_service.repository;

import com.ltz.user_service.entity.ConnectedAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConnectedAccountRepository extends JpaRepository<ConnectedAccount, Long> {
    List<ConnectedAccount> findByUserId(String userId);
    Optional<ConnectedAccount> findByUserIdAndPlatformName(String userId, String platformName);
    List<ConnectedAccount> findAllByUserIdIn(List<String> userIds);
}
