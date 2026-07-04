package com.ltz.hardware_service.entity;

import com.ltz.hardware_service.entity.enums.HardwareVisibility;
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
        name = "user_hardware",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_user_hardware_user_id", columnNames = "user_id")
        }
)
public class UserHardware extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Bu userId auth-service/user-service tarafındaki kullanıcı id'sidir.
     * Hardware-service içinde user tablosu tutulmaz.
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cpu_component_id")
    private HardwareComponent cpuComponent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gpu_component_id")
    private HardwareComponent gpuComponent;

    @Column(name = "ram_gb")
    private Integer ramGb;

    @Column(name = "ram_type", length = 50)
    private String ramType;

    @Column(name = "storage_gb")
    private Integer storageGb;

    @Column(name = "storage_type", length = 50)
    private String storageType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motherboard_component_id")
    private HardwareComponent motherboardComponent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monitor_component_id")
    private HardwareComponent monitorComponent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "keyboard_component_id")
    private HardwareComponent keyboardComponent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mouse_component_id")
    private HardwareComponent mouseComponent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "headset_component_id")
    private HardwareComponent headsetComponent;

    @Column(name = "operating_system", length = 150)
    private String operatingSystem;

    @Column(name = "monitor_resolution", length = 50)
    private String monitorResolution;

    @Column(name = "monitor_refresh_rate")
    private Integer monitorRefreshRate;

    @Column(name = "rig_image_url", length = 500)
    private String rigImageUrl;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false, length = 50)
    private HardwareVisibility visibility = HardwareVisibility.PRIVATE;
}
