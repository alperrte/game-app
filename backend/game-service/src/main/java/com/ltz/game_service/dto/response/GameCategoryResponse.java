package com.ltz.game_service.dto.response;

import com.ltz.game_service.enums.GameSource;

import java.time.LocalDateTime;

public class GameCategoryResponse {

    private Long id;
    private GameSource source;
    private String name;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GameCategoryResponse() {
    }

    public GameCategoryResponse(
            Long id,
            GameSource source,
            String name,
            String description,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.source = source;
        this.name = name;
        this.description = description;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public GameSource getSource() {
        return source;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}