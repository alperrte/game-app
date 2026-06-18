package com.ltz.review_service.repository;

import com.ltz.review_service.entity.ReviewLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);

    Optional<ReviewLike> findByReviewIdAndUserId(Long reviewId, Long userId);
}