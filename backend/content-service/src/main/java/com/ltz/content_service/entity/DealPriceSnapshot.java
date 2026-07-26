package com.ltz.content_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "deal_price_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealPriceSnapshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_title", nullable = false)
    private String gameTitle;

    @Column(name = "discounted_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountedPrice;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "recorded_at", nullable = false)
    @Builder.Default
    private LocalDateTime recordedAt = LocalDateTime.now();
}
