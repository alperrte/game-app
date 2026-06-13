package com.ltz.game_service.dto.request;

import jakarta.validation.constraints.Size;

public class GameSystemRequirementRequest {

    @Size(max = 150, message = "Minimum işletim sistemi bilgisi en fazla 150 karakter olabilir.")
    private String minimumOs;

    @Size(max = 150, message = "Minimum işlemci bilgisi en fazla 150 karakter olabilir.")
    private String minimumCpu;

    @Size(max = 150, message = "Minimum ekran kartı bilgisi en fazla 150 karakter olabilir.")
    private String minimumGpu;

    @Size(max = 100, message = "Minimum RAM bilgisi en fazla 100 karakter olabilir.")
    private String minimumRam;

    @Size(max = 100, message = "Minimum depolama bilgisi en fazla 100 karakter olabilir.")
    private String minimumStorage;

    @Size(max = 150, message = "Önerilen işletim sistemi bilgisi en fazla 150 karakter olabilir.")
    private String recommendedOs;

    @Size(max = 150, message = "Önerilen işlemci bilgisi en fazla 150 karakter olabilir.")
    private String recommendedCpu;

    @Size(max = 150, message = "Önerilen ekran kartı bilgisi en fazla 150 karakter olabilir.")
    private String recommendedGpu;

    @Size(max = 100, message = "Önerilen RAM bilgisi en fazla 100 karakter olabilir.")
    private String recommendedRam;

    @Size(max = 100, message = "Önerilen depolama bilgisi en fazla 100 karakter olabilir.")
    private String recommendedStorage;

    @Size(max = 1000, message = "Not bilgisi en fazla 1000 karakter olabilir.")
    private String notes;

    public GameSystemRequirementRequest() {
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
}