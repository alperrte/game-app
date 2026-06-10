package com.ltz.social_service.repository;

import com.ltz.social_service.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerUserIdAndBlockedUserId(Long blockerUserId, Long blockedUserId);

    Optional<UserBlock> findByBlockerUserIdAndBlockedUserId(Long blockerUserId, Long blockedUserId);

    List<UserBlock> findByBlockerUserId(Long blockerUserId);

    void deleteByBlockerUserIdAndBlockedUserId(Long blockerUserId, Long blockedUserId);
}