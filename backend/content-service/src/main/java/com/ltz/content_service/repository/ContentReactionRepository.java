package com.ltz.content_service.repository;

import com.ltz.content_service.model.entity.ContentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContentReactionRepository extends JpaRepository<ContentReaction, Long> {
    Optional<ContentReaction> findByUserIdAndContentIdAndContentType(Long userId, Long contentId, String contentType);

    List<ContentReaction> findByContentIdAndContentType(Long contentId, String contentType);

    @Query("SELECT r.reactionType, COUNT(r) FROM ContentReaction r " +
            "WHERE r.contentId = :contentId AND r.contentType = :contentType " +
            "GROUP BY r.reactionType")
    List<Object[]> countReactionsByContent(Long contentId, String contentType);
}
