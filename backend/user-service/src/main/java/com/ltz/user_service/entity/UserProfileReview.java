package com.ltz.user_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_profile_reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reviewer_id", nullable = false, length = 50)
    private String reviewerId;

    @Column(name = "reviewer_username", nullable = false, length = 100)
    private String reviewerUsername;

    @Column(name = "reviewer_display_name", length = 150)
    private String reviewerDisplayName;

    @Column(name = "reviewer_avatar_url", length = 255)
    private String reviewerAvatarUrl;

    @Column(name = "reviewed_id", nullable = false, length = 50)
    private String reviewedId;

    @Column(name = "content", nullable = false, length = 1000)
    private String content;

    @Column(name = "friendly_point", nullable = false)
    @Builder.Default
    private boolean friendlyPoint = false;

    @Column(name = "leader_point", nullable = false)
    @Builder.Default
    private boolean leaderPoint = false;

    @Column(name = "aim_god_point", nullable = false)
    @Builder.Default
    private boolean aimGodPoint = false;

    @Column(name = "tactician_point", nullable = false)
    @Builder.Default
    private boolean tacticianPoint = false;

    @Column(name = "reported", nullable = false)
    @Builder.Default
    private boolean reported = false;

    @Column(name = "report_reason", length = 255)
    private String reportReason;

    @Builder.Default
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

