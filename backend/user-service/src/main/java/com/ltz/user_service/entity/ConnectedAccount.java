package com.ltz.user_service.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "connected_accounts",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "platform_name"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConnectedAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "platform_name", nullable = false, length = 50)
    private String platformName;

    @Column(name = "platform_user_id", nullable = false, length = 100)
    private String platformUserId;

    @Column(name = "platform_username", length = 100)
    private String platformUsername;

    @CreationTimestamp
    @Column(name = "connected_at", nullable = false, updatable = false)
    private LocalDateTime connectedAt;
}
