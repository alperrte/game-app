package com.ltz.social_service.repository;

import com.ltz.social_service.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    List<PostComment> findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(Long postId);
    Page<PostComment> findByPostIdAndIsDeletedFalse(Long postId, Pageable pageable);

    List<PostComment> findByParentCommentIdAndIsDeletedFalseOrderByCreatedAtAsc(Long parentCommentId);

    long countByPostIdAndIsDeletedFalse(Long postId);

    List<PostComment> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Long userId);
}
