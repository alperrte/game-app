package com.ltz.social_service.entity;

import com.ltz.social_service.enums.CommunityVisibility;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "communities")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Community {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(length = 80)
    private String category;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "members_visible", nullable = false)
    private Boolean membersVisible;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommunityVisibility visibility;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        if (visibility == null) visibility = CommunityVisibility.PUBLIC;
        if (membersVisible == null) membersVisible = true;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
