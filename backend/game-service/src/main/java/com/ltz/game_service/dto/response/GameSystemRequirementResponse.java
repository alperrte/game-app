package com.ltz.game_service.dto.response;

import java.time.LocalDateTime;

public class GameSystemRequirementResponse {

    private Long id;
    private Long gameId;

    private String minimumOs;
    private String minimumCpu;
    private String minimumGpu;
    private String minimumRam;
    private String minimumStorage;

    private String recommendedOs;
    private String recommendedCpu;
    private String recommendedGpu;
    private String recommendedRam;
    private String recommendedStorage;

    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GameSystemRequirementResponse() {
    }

    public GameSystemRequirementResponse(
            Long id,
            Long gameId,
            String minimumOs,
            String minimumCpu,
            String minimumGpu,
            String minimumRam,
            String minimumStorage,
            String recommendedOs,
            String recommendedCpu,
            String recommendedGpu,
            String recommendedRam,
            String recommendedStorage,
            String notes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.gameId = gameId;
        this.minimumOs = minimumOs;
        this.minimumCpu = minimumCpu;
        this.minimumGpu = minimumGpu;
        this.minimumRam = minimumRam;
        this.minimumStorage = minimumStorage;
        this.recommendedOs = recommendedOs;
        this.recommendedCpu = recommendedCpu;
        this.recommendedGpu = recommendedGpu;
        this.recommendedRam = recommendedRam;
        this.recommendedStorage = recommendedStorage;
        this.notes = notes;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getGameId() {
        return gameId;
    }

    public String getMinimumOs() {
        return minimumOs;
    }

    public String getMinimumCpu() {
        return minimumCpu;
    }

    public String getMinimumGpu() {
        return minimumGpu;
    }

    public String getMinimumRam() {
        return minimumRam;
    }

    public String getMinimumStorage() {
        return minimumStorage;
    }

    public String getRecommendedOs() {
        return recommendedOs;
    }

    public String getRecommendedCpu() {
        return recommendedCpu;
    }

    public String getRecommendedGpu() {
        return recommendedGpu;
    }

    public String getRecommendedRam() {
        return recommendedRam;
    }

    public String getRecommendedStorage() {
        return recommendedStorage;
    }

    public String getNotes() {
        return notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}