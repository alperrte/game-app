package com.ltz.user_service.repository;

import com.ltz.user_service.entity.UserAssignedBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAssignedBadgeRepository extends JpaRepository<UserAssignedBadge, Long> {
    List<UserAssignedBadge> findByUserId(String userId);

    Optional<UserAssignedBadge> findByUserIdAndBadgeKey(String userId, String badgeKey);

    void deleteByUserIdAndBadgeKey(String userId, String badgeKey);
}
