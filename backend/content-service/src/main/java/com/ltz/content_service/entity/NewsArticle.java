package com.ltz.content_service.entity;

import com.ltz.content_service.enums.NewsCategory;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "news_articles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NewsArticle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String summary;

    @Column(name = "content_url", nullable = false, unique = true, length = 500)
    private String contentUrl;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "source_name", nullable = false, length = 100)
    private String sourceName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private NewsCategory category;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "published_at")
    private LocalDateTime publishedAt;
}
