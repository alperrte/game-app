package com.ltz.user_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_profile_clips")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileClip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "video_url", nullable = false, length = 255)
    private String videoUrl;

    @Column(nullable = false, length = 20)
    private String platform;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
