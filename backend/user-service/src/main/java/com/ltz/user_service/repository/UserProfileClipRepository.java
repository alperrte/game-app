package com.ltz.user_service.repository;

import com.ltz.user_service.entity.UserProfileClip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface UserProfileClipRepository extends JpaRepository<UserProfileClip, Long> {
    List<UserProfileClip> findByUserIdOrderByCreatedAtDesc(String userId);
    long countByUserId(String userId);
}
