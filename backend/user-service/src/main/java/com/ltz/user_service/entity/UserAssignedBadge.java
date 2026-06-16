package com.ltz.user_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_assigned_badges", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_assigned_badge", columnNames = {"user_id", "badge_key"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAssignedBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "badge_key", nullable = false, length = 50)
    private String badgeKey;

    @Column(nullable = false, length = 100)
    private String label;

    @Column(name = "assigned_by", nullable = false, length = 50)
    private String assignedBy;

    @CreationTimestamp
    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;
}
