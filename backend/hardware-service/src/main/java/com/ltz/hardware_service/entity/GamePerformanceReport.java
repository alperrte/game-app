package com.ltz.hardware_service.entity;

import com.ltz.hardware_service.entity.enums.GraphicsPreset;
import com.ltz.hardware_service.entity.enums.UpscalingType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "game_performance_reports")
public class GamePerformanceReport extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * userId auth-service/user-service tarafındaki kullanıcı id'sidir.
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /*
     * gameId game-service tarafındaki oyun id'sidir.
     * Hardware-service içinde game tablosu tutulmaz.
     */
    @Column(name = "game_id", nullable = false)
    private Long gameId;

    /*
     * Review-service bağlantısı en sona bırakıldı.
     * Şimdilik kullanılmayacak, ileride nullable şekilde bağlanabilir.
     */
    @Column(name = "review_id")
    private Long reviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cpu_component_id")
    private HardwareComponent cpuComponent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gpu_component_id")
    private HardwareComponent gpuComponent;

    @Column(name = "ram_gb")
    private Integer ramGb;

    @Column(name = "resolution", length = 50)
    private String resolution;

    @Enumerated(EnumType.STRING)
    @Column(name = "graphics_preset", length = 50)
    private GraphicsPreset graphicsPreset;

    @Column(name = "average_fps")
    private Integer averageFps;

    @Column(name = "minimum_fps")
    private Integer minimumFps;

    @Column(name = "maximum_fps")
    private Integer maximumFps;

    @Builder.Default
    @Column(name = "ray_tracing_enabled", nullable = false)
    private Boolean rayTracingEnabled = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "upscaling_type", length = 50)
    private UpscalingType upscalingType;

    @Column(name = "driver_version", length = 100)
    private String driverVersion;

    @Column(name = "notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;
}