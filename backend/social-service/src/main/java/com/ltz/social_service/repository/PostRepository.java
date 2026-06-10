package com.ltz.social_service.repository;

import com.ltz.social_service.entity.Post;
import com.ltz.social_service.enums.PostVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Long userId);

    List<Post> findByVisibilityAndIsDeletedFalseOrderByCreatedAtDesc(PostVisibility visibility);

    List<Post> findByIsDeletedFalseOrderByCreatedAtDesc();
}