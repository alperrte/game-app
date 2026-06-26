package com.ltz.social_service.repository;

import com.ltz.social_service.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    boolean existsByPostIdAndUserId(Long postId, Long userId);

    Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);

    List<PostLike> findByPostIdOrderByCreatedAtDesc(Long postId);
    Page<PostLike> findByPostId(Long postId, Pageable pageable);

    long countByPostId(Long postId);

    void deleteByPostIdAndUserId(Long postId, Long userId);
}
