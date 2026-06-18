package com.ltz.review_service.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
@Table(name = "review_reports")
public class ReviewReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "İnceleme boş olamaz.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "review_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_review_reports_review")
    )
    private Review review;

    @NotNull(message = "Kullanıcı ID boş olamaz.")
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @NotBlank(message = "Rapor sebebi boş olamaz.")
    @Size(max = 500, message = "Rapor sebebi en fazla 500 karakter olabilir.")
    @Column(name = "reason", nullable = false, length = 500)
    private String reason;

    @NotNull(message = "Rapor durumu boş olamaz.")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private ReviewReportStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        if (status == null) {
            status = ReviewReportStatus.PENDING;
        }
    }
}