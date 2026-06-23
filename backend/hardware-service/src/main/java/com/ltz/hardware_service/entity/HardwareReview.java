package com.ltz.hardware_service.entity;

import com.ltz.hardware_service.entity.enums.HardwareReviewType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "hardware_reviews")
public class HardwareReview extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Bu userId auth-service/user-service tarafındaki kullanıcı id'sidir.
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", nullable = false)
    private HardwareComponent component;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_type", nullable = false, length = 50)
    private HardwareReviewType reviewType;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "content", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String content;

    @Column(name = "pros", columnDefinition = "NVARCHAR(MAX)")
    private String pros;

    @Column(name = "cons", columnDefinition = "NVARCHAR(MAX)")
    private String cons;

    @Column(name = "usage_duration_months")
    private Integer usageDurationMonths;

    @Builder.Default
    @Column(name = "verified_owner", nullable = false)
    private Boolean verifiedOwner = false;

    @Builder.Default
    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Builder.Default
    @Column(name = "report_count", nullable = false)
    private Integer reportCount = 0;
}