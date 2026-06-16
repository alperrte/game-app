package com.ltz.game_service.dto.response.external;

import com.ltz.game_service.enums.GameSource;

public class ExternalGameTagResponse {

    private GameSource source;
    private String externalId;
    private String name;
    private String description;
    private Integer gameCount;
    private String status;
    private String sourceProvider;
    private String imageUrl;

    public ExternalGameTagResponse() {
    }

    public ExternalGameTagResponse(
            GameSource source,
            String externalId,
            String name,
            String description,
            Integer gameCount,
            String status,
            String sourceProvider,
            String imageUrl
    ) {
        this.source = source;
        this.externalId = externalId;
        this.name = name;
        this.description = description;
        this.gameCount = gameCount;
        this.status = status;
        this.sourceProvider = sourceProvider;
        this.imageUrl = imageUrl;
    }

    public GameSource getSource() {
        return source;
    }

    public void setSource(GameSource source) {
        this.source = source;
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getGameCount() {
        return gameCount;
    }

    public void setGameCount(Integer gameCount) {
        this.gameCount = gameCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSourceProvider() {
        return sourceProvider;
    }

    public void setSourceProvider(String sourceProvider) {
        this.sourceProvider = sourceProvider;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}