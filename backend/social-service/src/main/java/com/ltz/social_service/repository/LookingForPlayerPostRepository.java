package com.ltz.social_service.repository;

import com.ltz.social_service.entity.LookingForPlayerPost;
import com.ltz.social_service.enums.LookingForPlayerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LookingForPlayerPostRepository extends JpaRepository<LookingForPlayerPost, Long> {

    List<LookingForPlayerPost> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<LookingForPlayerPost> findByGameIdAndStatusOrderByCreatedAtDesc(
            Long gameId,
            LookingForPlayerStatus status
    );

    List<LookingForPlayerPost> findByStatusOrderByCreatedAtDesc(LookingForPlayerStatus status);
}