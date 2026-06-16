package com.ltz.social_service.repository;

import com.ltz.social_service.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    List<PostComment> findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(Long postId);

    List<PostComment> findByParentCommentIdAndIsDeletedFalseOrderByCreatedAtAsc(Long parentCommentId);

    long countByPostIdAndIsDeletedFalse(Long postId);

    List<PostComment> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Long userId);
}