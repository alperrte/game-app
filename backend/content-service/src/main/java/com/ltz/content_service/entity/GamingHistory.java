package com.ltz.content_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gaming_history", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_day", "event_month", "event_year", "title"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GamingHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_day", nullable = false)
    private int eventDay;

    @Column(name = "event_month", nullable = false)
    private int eventMonth;

    @Column(name = "event_year", nullable = false)
    private int eventYear;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
