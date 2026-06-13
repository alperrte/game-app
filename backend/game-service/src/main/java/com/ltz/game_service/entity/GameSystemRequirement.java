package com.ltz.game_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_system_requirements")
public class GameSystemRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "game_id", nullable = false, unique = true)
    private Long gameId;

    @Size(max = 150)
    @Column(name = "minimum_os", length = 150)
    private String minimumOs;

    @Size(max = 150)
    @Column(name = "minimum_cpu", length = 150)
    private String minimumCpu;

    @Size(max = 150)
    @Column(name = "minimum_gpu", length = 150)
    private String minimumGpu;

    @Size(max = 100)
    @Column(name = "minimum_ram", length = 100)
    private String minimumRam;

    @Size(max = 100)
    @Column(name = "minimum_storage", length = 100)
    private String minimumStorage;

    @Size(max = 150)
    @Column(name = "recommended_os", length = 150)
    private String recommendedOs;

    @Size(max = 150)
    @Column(name = "recommended_cpu", length = 150)
    private String recommendedCpu;

    @Size(max = 150)
    @Column(name = "recommended_gpu", length = 150)
    private String recommendedGpu;

    @Size(max = 100)
    @Column(name = "recommended_ram", length = 100)
    private String recommendedRam;

    @Size(max = 100)
    @Column(name = "recommended_storage", length = 100)
    private String recommendedStorage;

    @Size(max = 1000)
    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public GameSystemRequirement() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getGameId() {
        return gameId;
    }

    public void setGameId(Long gameId) {
        this.gameId = gameId;
    }

    public String getMinimumOs() {
        return minimumOs;
    }

    public void setMinimumOs(String minimumOs) {
        this.minimumOs = minimumOs;
    }

    public String getMinimumCpu() {
        return minimumCpu;
    }

    public void setMinimumCpu(String minimumCpu) {
        this.minimumCpu = minimumCpu;
    }

    public String getMinimumGpu() {
        return minimumGpu;
    }

    public void setMinimumGpu(String minimumGpu) {
        this.minimumGpu = minimumGpu;
    }

    public String getMinimumRam() {
        return minimumRam;
    }

    public void setMinimumRam(String minimumRam) {
        this.minimumRam = minimumRam;
    }

    public String getMinimumStorage() {
        return minimumStorage;
    }

    public void setMinimumStorage(String minimumStorage) {
        this.minimumStorage = minimumStorage;
    }

    public String getRecommendedOs() {
        return recommendedOs;
    }

    public void setRecommendedOs(String recommendedOs) {
        this.recommendedOs = recommendedOs;
    }

    public String getRecommendedCpu() {
        return recommendedCpu;
    }

    public void setRecommendedCpu(String recommendedCpu) {
        this.recommendedCpu = recommendedCpu;
    }

    public String getRecommendedGpu() {
        return recommendedGpu;
    }

    public void setRecommendedGpu(String recommendedGpu) {
        this.recommendedGpu = recommendedGpu;
    }

    public String getRecommendedRam() {
        return recommendedRam;
    }

    public void setRecommendedRam(String recommendedRam) {
        this.recommendedRam = recommendedRam;
    }

    public String getRecommendedStorage() {
        return recommendedStorage;
    }

    public void setRecommendedStorage(String recommendedStorage) {
        this.recommendedStorage = recommendedStorage;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}