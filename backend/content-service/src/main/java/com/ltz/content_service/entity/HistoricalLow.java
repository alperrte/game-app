package com.ltz.content_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "historical_lows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricalLow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_title", nullable = false, unique = true)
    private String gameTitle;

    @Column(name = "lowest_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal lowestPrice;

    @Column(name = "store_name", nullable = false, length = 50)
    private String storeName;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "recorded_at", nullable = false)
    @Builder.Default
    private LocalDateTime recordedAt = LocalDateTime.now();
}
