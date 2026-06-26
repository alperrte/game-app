package com.ltz.user_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "privacy_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PrivacySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true, length = 50)
    private String userId;

    @Column(name = "profile_visibility", nullable = false, length = 50)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Visibility profileVisibility = Visibility.PUBLIC;

    @Column(name = "game_library_visibility", nullable = false, length = 50)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Visibility gameLibraryVisibility = Visibility.PUBLIC;

    @Column(name = "hardware_visibility", nullable = false, length = 50)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Visibility hardwareVisibility = Visibility.PUBLIC;

    @Column(name = "friend_list_visibility", nullable = false, length = 50)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Visibility friendListVisibility = Visibility.PUBLIC;

    @Column(name = "follower_list_visibility", nullable = false, length = 50)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Visibility followerListVisibility = Visibility.PUBLIC;

    @Column(name = "last_seen_visibility", nullable = false, length = 50)
    @Builder.Default
    @Enumerated(EnumType.STRING)
    private Visibility lastSeenVisibility = Visibility.PUBLIC;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
