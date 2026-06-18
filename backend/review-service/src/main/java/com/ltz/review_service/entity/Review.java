package com.ltz.review_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Oyun kaynağı boş olamaz.")
    @Size(max = 30, message = "Oyun kaynağı en fazla 30 karakter olabilir.")
    @Column(name = "game_source", nullable = false, length = 30)
    private String gameSource;

    @Column(name = "game_id")
    private Long gameId;

    @Size(max = 100, message = "Harici oyun ID en fazla 100 karakter olabilir.")
    @Column(name = "external_game_id", length = 100)
    private String externalGameId;

    @NotNull(message = "Kullanıcı ID boş olamaz.")
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotNull(message = "Puan boş olamaz.")
    @Min(value = 1, message = "Puan en az 1 olmalıdır.")
    @Max(value = 10, message = "Puan en fazla 10 olmalıdır.")
    @Column(name = "rating", nullable = false)
    private Integer rating;

    @NotBlank(message = "İnceleme metni boş olamaz.")
    @Size(max = 3000, message = "İnceleme metni en fazla 3000 karakter olabilir.")
    @Column(name = "review_text", nullable = false, length = 3000)
    private String reviewText;

    @NotNull(message = "Olumlu/olumsuz değerlendirme boş olamaz.")
    @Column(name = "recommended", nullable = false)
    private Boolean recommended;

    @PositiveOrZero(message = "Oynama süresi negatif olamaz.")
    @Column(name = "playtime_hours")
    private Integer playtimeHours;

    @Size(max = 100, message = "Platform en fazla 100 karakter olabilir.")
    @Column(name = "platform", length = 100)
    private String platform;

    @Size(max = 500, message = "Donanım bilgisi en fazla 500 karakter olabilir.")
    @Column(name = "hardware_info", length = 500)
    private String hardwareInfo;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount;

    @Column(name = "report_count", nullable = false)
    private Integer reportCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        if (createdAt == null) {
            createdAt = now;
        }

        if (gameSource == null || gameSource.isBlank()) {
            gameSource = "INTERNAL";
        }

        if (likeCount == null) {
            likeCount = 0;
        }

        if (reportCount == null) {
            reportCount = 0;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}