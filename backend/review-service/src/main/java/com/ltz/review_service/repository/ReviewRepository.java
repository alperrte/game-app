package com.ltz.review_service.repository;

import com.ltz.review_service.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByGameSourceAndGameIdOrderByCreatedAtDesc(
            String gameSource,
            Long gameId
    );

    List<Review> findByGameSourceAndExternalGameIdOrderByCreatedAtDesc(
            String gameSource,
            String externalGameId
    );

    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Review> findTop10ByGameSourceAndGameIdOrderByLikeCountDescCreatedAtDesc(
            String gameSource,
            Long gameId
    );

    List<Review> findTop10ByGameSourceAndExternalGameIdOrderByLikeCountDescCreatedAtDesc(
            String gameSource,
            String externalGameId
    );

    boolean existsByGameSourceAndGameIdAndUserId(
            String gameSource,
            Long gameId,
            Long userId
    );

    boolean existsByGameSourceAndExternalGameIdAndUserId(
            String gameSource,
            String externalGameId,
            Long userId
    );

    @Query("""
            SELECT AVG(r.rating)
            FROM Review r
            WHERE r.gameSource = :gameSource
            AND r.gameId = :gameId
            """)
    Double findAverageRatingByGameSourceAndGameId(String gameSource, Long gameId);

    @Query("""
            SELECT AVG(r.rating)
            FROM Review r
            WHERE r.gameSource = :gameSource
            AND r.externalGameId = :externalGameId
            """)
    Double findAverageRatingByGameSourceAndExternalGameId(
            String gameSource,
            String externalGameId
    );

    long countByGameSourceAndGameId(String gameSource, Long gameId);

    long countByGameSourceAndExternalGameId(String gameSource, String externalGameId);

    default List<Review> findByGameIdOrderByCreatedAtDesc(Long gameId) {
        return findByGameSourceAndGameIdOrderByCreatedAtDesc("INTERNAL", gameId);
    }

    default List<Review> findTop10ByGameIdOrderByLikeCountDescCreatedAtDesc(Long gameId) {
        return findTop10ByGameSourceAndGameIdOrderByLikeCountDescCreatedAtDesc(
                "INTERNAL",
                gameId
        );
    }

    default boolean existsByGameIdAndUserId(Long gameId, Long userId) {
        return existsByGameSourceAndGameIdAndUserId("INTERNAL", gameId, userId);
    }

    default Double findAverageRatingByGameId(Long gameId) {
        return findAverageRatingByGameSourceAndGameId("INTERNAL", gameId);
    }

    default long countByGameId(Long gameId) {
        return countByGameSourceAndGameId("INTERNAL", gameId);
    }
}