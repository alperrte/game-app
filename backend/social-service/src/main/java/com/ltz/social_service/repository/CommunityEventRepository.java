package com.ltz.social_service.repository;

import com.ltz.social_service.entity.CommunityEvent;
import com.ltz.social_service.enums.CommunityEventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CommunityEventRepository extends JpaRepository<CommunityEvent, Long> {
    Page<CommunityEvent> findByStatusAndStartsAtAfter(
            CommunityEventStatus status,
            LocalDateTime startsAt,
            Pageable pageable);
    Page<CommunityEvent> findByCommunityId(Long communityId, Pageable pageable);
    List<CommunityEvent> findByCommunityId(Long communityId);
}
