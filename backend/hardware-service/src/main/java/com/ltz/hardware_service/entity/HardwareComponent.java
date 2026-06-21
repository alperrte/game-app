package com.ltz.hardware_service.entity;

import com.ltz.hardware_service.entity.enums.ComponentCategory;
import com.ltz.hardware_service.entity.enums.ComponentType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "hardware_components")
public class HardwareComponent extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "component_type", nullable = false, length = 50)
    private ComponentType componentType;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 50)
    private ComponentCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id")
    private HardwareBrand brand;

    @Column(name = "series_name", length = 150)
    private String seriesName;

    @Column(name = "model_name", nullable = false, length = 200)
    private String modelName;

    @Column(name = "normalized_name", length = 250)
    private String normalizedName;

    @Column(name = "aliases", columnDefinition = "NVARCHAR(MAX)")
    private String aliases;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Builder.Default
    @Column(name = "verified", nullable = false)
    private Boolean verified = false;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "vram_gb")
    private Integer vramGb;

    @Column(name = "core_count")
    private Integer coreCount;

    @Column(name = "thread_count")
    private Integer threadCount;

    @Column(name = "memory_gb")
    private Integer memoryGb;

    @Column(name = "storage_capacity_gb")
    private Integer storageCapacityGb;

    @Column(name = "extra_specs", columnDefinition = "NVARCHAR(MAX)")
    private String extraSpecs;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;
}