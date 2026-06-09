package com.ltz.social_service.entity;

import com.ltz.social_service.enums.LookingForPlayerStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "looking_for_player_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LookingForPlayerPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "game_id", nullable = false)
    private Long gameId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 50)
    private String platform;

    @Column(name = "preferred_role", length = 100)
    private String preferredRole;

    @Column(name = "player_level", length = 50)
    private String playerLevel;

    @Column(name = "microphone_required", nullable = false)
    private Boolean microphoneRequired;

    @Column(name = "play_time")
    private LocalDateTime playTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LookingForPlayerStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.microphoneRequired == null) {
            this.microphoneRequired = false;
        }

        if (this.status == null) {
            this.status = LookingForPlayerStatus.OPEN;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}