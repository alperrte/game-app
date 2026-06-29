package com.ltz.social_service.repository;

import com.ltz.social_service.entity.CommunityInvitation;
import com.ltz.social_service.enums.CommunityInvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommunityInvitationRepository
        extends JpaRepository<CommunityInvitation, Long> {

    Optional<CommunityInvitation> findByCommunityIdAndInvitedUserId(
            Long communityId,
            Long invitedUserId
    );

    List<CommunityInvitation> findByInvitedUserIdAndStatusOrderByCreatedAtDesc(
            Long invitedUserId,
            CommunityInvitationStatus status
    );

    void deleteByCommunityId(Long communityId);
}
