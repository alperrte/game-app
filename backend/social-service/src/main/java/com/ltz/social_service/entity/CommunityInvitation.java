package com.ltz.social_service.entity;

import com.ltz.social_service.enums.CommunityInvitationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "community_invitations",
        uniqueConstraints = @UniqueConstraint(columnNames = {"community_id", "invited_user_id"})
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunityInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "community_id", nullable = false)
    private Long communityId;

    @Column(name = "inviter_user_id", nullable = false)
    private Long inviterUserId;

    @Column(name = "invited_user_id", nullable = false)
    private Long invitedUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommunityInvitationStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        if (status == null) status = CommunityInvitationStatus.PENDING;
    }
}
