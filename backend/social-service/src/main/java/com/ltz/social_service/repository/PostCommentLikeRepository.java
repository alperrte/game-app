package com.ltz.social_service.repository;

import com.ltz.social_service.entity.PostCommentLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostCommentLikeRepository extends JpaRepository<PostCommentLike, Long> {

    boolean existsByCommentIdAndUserId(Long commentId, Long userId);

    Optional<PostCommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    long countByCommentId(Long commentId);

    void deleteByCommentIdAndUserId(Long commentId, Long userId);
}
