package com.ltz.social_service.repository;

import com.ltz.social_service.entity.Post;
import com.ltz.social_service.enums.PostVisibility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(Long userId);
    Page<Post> findByUserIdAndIsDeletedFalse(Long userId, Pageable pageable);

    List<Post> findByVisibilityAndIsDeletedFalseOrderByCreatedAtDesc(PostVisibility visibility);
    Page<Post> findByVisibilityAndIsDeletedFalse(PostVisibility visibility, Pageable pageable);
    Page<Post> findByVisibilityAndCommunityIdIsNullAndIsDeletedFalse(
            PostVisibility visibility,
            Pageable pageable);
    Page<Post> findByCommunityIdIsNullAndIsDeletedFalse(Pageable pageable);
    Page<Post> findByCommunityIdAndIsDeletedFalse(Long communityId, Pageable pageable);
    List<Post> findByCommunityIdAndIsDeletedFalse(Long communityId);
    List<Post> findByCommunityId(Long communityId);
    Page<Post> findByCommunityIdInAndIsDeletedFalse(List<Long> communityIds, Pageable pageable);

    List<Post> findByIsDeletedFalseOrderByCreatedAtDesc();
}
