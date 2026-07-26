package com.ltz.content_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "live_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiveStat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "stat_key", nullable = false, unique = true, length = 100)
    private String statKey;

    @Column(name = "stat_value", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String statValue;

    @Column(name = "is_reliable", nullable = false)
    @Builder.Default
    private boolean isReliable = true;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
