package com.ltz.review_service.repository;

import com.ltz.review_service.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByGameIdOrderByCreatedAtDesc(Long gameId);

    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Review> findTop10ByGameIdOrderByLikeCountDescCreatedAtDesc(Long gameId);

    boolean existsByGameIdAndUserId(Long gameId, Long userId);

    @Query("""
            SELECT AVG(r.rating)
            FROM Review r
            WHERE r.gameId = :gameId
            """)
    Double findAverageRatingByGameId(Long gameId);

    long countByGameId(Long gameId);
}