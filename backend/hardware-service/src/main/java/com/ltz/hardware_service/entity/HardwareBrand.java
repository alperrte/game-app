package com.ltz.hardware_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "hardware_brands",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_hardware_brands_name", columnNames = "name")
        }
)
public class HardwareBrand extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "website_url", length = 500)
    private String websiteUrl;

    @Builder.Default
    @Column(name = "active", nullable = false)
    private Boolean active = true;
}