package com.ltz.social_service.repository;

import com.ltz.social_service.entity.LookingForPlayerPost;
import com.ltz.social_service.enums.LookingForPlayerStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LookingForPlayerPostRepository extends JpaRepository<LookingForPlayerPost, Long> {

    Page<LookingForPlayerPost> findByUserId(Long userId, Pageable pageable);

    Page<LookingForPlayerPost> findByGameIdAndStatus(
            Long gameId,
            LookingForPlayerStatus status,
            Pageable pageable
    );

    Page<LookingForPlayerPost> findByStatus(
            LookingForPlayerStatus status,
            Pageable pageable
    );
}
