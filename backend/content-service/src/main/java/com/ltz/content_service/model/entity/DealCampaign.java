package com.ltz.content_service.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "deal_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealCampaign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_title", nullable = false)
    private String gameTitle;

    @Column(name = "store_name", nullable = false, length = 50)
    private String storeName;

    @Column(name = "deal_url", nullable = false, unique = true, length = 500)
    private String dealUrl;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "original_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "discounted_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountedPrice;

    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "steam_deck_status", length = 50)
    private String steamDeckStatus;

    @Column(name = "is_cross_play", nullable = false)
    @Builder.Default
    private boolean isCrossPlay = false;

    @Column(name = "is_free", nullable = false)
    @Builder.Default
    private boolean isFree = false;

    @Column(name = "ends_at")
    private LocalDateTime endsAt;

    @Column(name = "metacritic_score")
    private Integer metacriticScore;

    @Column(name = "steam_rating_percent")
    private Integer steamRatingPercent;

    @Column(name = "last_updated", nullable = false)
    @Builder.Default
    private LocalDateTime lastUpdated = LocalDateTime.now();
}
