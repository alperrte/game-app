package com.ltz.hardware_service.entity;

import com.ltz.hardware_service.entity.enums.DealSourceType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "hardware_deals")
public class HardwareDeal extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id")
    private HardwareComponent component;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "store_name", length = 150)
    private String storeName;

    @Column(name = "old_price", precision = 18, scale = 2)
    private BigDecimal oldPrice;

    @Column(name = "new_price", precision = 18, scale = 2)
    private BigDecimal newPrice;

    @Builder.Default
    @Column(name = "currency", nullable = false, length = 10)
    private String currency = "TRY";

    @Column(name = "discount_percentage", precision = 5, scale = 2)
    private BigDecimal discountPercentage;

    @Column(name = "deal_url", length = 1000)
    private String dealUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 50)
    private DealSourceType sourceType = DealSourceType.MANUAL;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;
}