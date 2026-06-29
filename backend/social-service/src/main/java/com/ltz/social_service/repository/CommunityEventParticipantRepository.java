package com.ltz.social_service.repository;

import com.ltz.social_service.entity.CommunityEventParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommunityEventParticipantRepository
        extends JpaRepository<CommunityEventParticipant, Long> {
    boolean existsByEventIdAndUserId(Long eventId, Long userId);
    long countByEventId(Long eventId);
    void deleteByEventIdAndUserId(Long eventId, Long userId);
    void deleteByEventId(Long eventId);
}
