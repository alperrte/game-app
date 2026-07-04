package com.ltz.user_service.repository;

import com.ltz.user_service.entity.UserProfileReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserProfileReviewRepository extends JpaRepository<UserProfileReview, Long> {

    List<UserProfileReview> findByReviewedIdOrderByCreatedAtDesc(String reviewedId);

    long countByReviewedId(String reviewedId);

    @Query("SELECT COUNT(r) FROM UserProfileReview r WHERE r.reviewedId = :reviewedId AND r.friendlyPoint = true")
    long countFriendlyPoints(@Param("reviewedId") String reviewedId);

    @Query("SELECT COUNT(r) FROM UserProfileReview r WHERE r.reviewedId = :reviewedId AND r.leaderPoint = true")
    long countLeaderPoints(@Param("reviewedId") String reviewedId);

    @Query("SELECT COUNT(r) FROM UserProfileReview r WHERE r.reviewedId = :reviewedId AND r.aimGodPoint = true")
    long countAimGodPoints(@Param("reviewedId") String reviewedId);

    @Query("SELECT COUNT(r) FROM UserProfileReview r WHERE r.reviewedId = :reviewedId AND r.tacticianPoint = true")
    long countTacticianPoints(@Param("reviewedId") String reviewedId);

    boolean existsByReviewerIdAndReviewedId(String reviewerId, String reviewedId);
}
