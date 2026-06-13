package com.ltz.game_service.dto.response;

import java.time.LocalDateTime;

public class DeveloperResponse {

    private Long id;
    private String name;
    private String description;
    private String websiteUrl;
    private String country;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public DeveloperResponse() {
    }

    public DeveloperResponse(
            Long id,
            String name,
            String description,
            String websiteUrl,
            String country,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.websiteUrl = websiteUrl;
        this.country = country;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public String getCountry() {
        return country;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}