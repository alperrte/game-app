package com.ltz.content_service.service;

import com.ltz.content_service.entity.ContentReaction;
import com.ltz.content_service.enums.ReactionType;
import com.ltz.content_service.repository.ContentReactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReactionsService {

    private final ContentReactionRepository reactionRepository;

    @Transactional
    public void reactToContent(Long userId, Long contentId, String contentType, ReactionType reactionType) {
        String upperContentType = contentType.toUpperCase();
        if (!upperContentType.equals("NEWS") && !upperContentType.equals("CAMPAIGN")) {
            throw new IllegalArgumentException("Invalid content type. Must be NEWS or CAMPAIGN");
        }

        Optional<ContentReaction> existingOpt = reactionRepository.findByUserIdAndContentIdAndContentType(userId, contentId, upperContentType);

        if (existingOpt.isPresent()) {
            ContentReaction reaction = existingOpt.get();
            reaction.setReactionType(reactionType);
            reaction.setCreatedAt(LocalDateTime.now());
            reactionRepository.save(reaction);
            log.info("User {} updated reaction on {} {} to {}", userId, upperContentType, contentId, reactionType);
        } else {
            ContentReaction reaction = ContentReaction.builder()
                    .userId(userId)
                    .contentId(contentId)
                    .contentType(upperContentType)
                    .reactionType(reactionType)
                    .createdAt(LocalDateTime.now())
                    .build();
            reactionRepository.save(reaction);
            log.info("User {} reacted on {} {} with {}", userId, upperContentType, contentId, reactionType);
        }
    }

    @Transactional
    public void removeReaction(Long userId, Long contentId, String contentType) {
        String upperContentType = contentType.toUpperCase();
        Optional<ContentReaction> existingOpt = reactionRepository.findByUserIdAndContentIdAndContentType(userId, contentId, upperContentType);

        if (existingOpt.isPresent()) {
            reactionRepository.delete(existingOpt.get());
            log.info("User {} removed reaction from {} {}", userId, upperContentType, contentId);
        }
    }

    public Map<String, Long> getReactionsSummary(Long contentId, String contentType) {
        String upperContentType = contentType.toUpperCase();
        List<Object[]> rawCounts = reactionRepository.countReactionsByContent(contentId, upperContentType);
        
        Map<String, Long> summary = new HashMap<>();
        // Initialize all reaction types with 0 count
        for (ReactionType type : ReactionType.values()) {
            summary.put(type.name(), 0L);
        }

        for (Object[] row : rawCounts) {
            if (row[0] != null) {
                String typeStr;
                if (row[0] instanceof ReactionType reactionType) {
                    typeStr = reactionType.name();
                } else {
                    typeStr = row[0].toString();
                }
                Long count = ((Number) row[1]).longValue();
                summary.put(typeStr, count);
            }
        }
        return summary;
    }

    public String getUserReaction(Long userId, Long contentId, String contentType) {
        if (userId == null) {
            return null;
        }
        String upperContentType = contentType.toUpperCase();
        return reactionRepository.findByUserIdAndContentIdAndContentType(userId, contentId, upperContentType)
                .map(r -> r.getReactionType().name())
                .orElse(null);
    }
}
