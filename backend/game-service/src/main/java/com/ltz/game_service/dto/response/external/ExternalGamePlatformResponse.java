package com.ltz.game_service.dto.response.external;

import com.ltz.game_service.entity.enums.GameSource;

public class ExternalGamePlatformResponse {

    private GameSource source;
    private String name;
    private String description;
    private String status;
    private Integer totalGames;
    private String activeUsers;
    private Integer releaseYear;
    private String developer;
    private String dataSource;
    private String logoUrl;

    public ExternalGamePlatformResponse() {
    }

    public ExternalGamePlatformResponse(
            GameSource source,
            String name,
            String description,
            String status,
            Integer totalGames,
            String activeUsers,
            Integer releaseYear,
            String developer,
            String dataSource,
            String logoUrl
    ) {
        this.source = source;
        this.name = name;
        this.description = description;
        this.status = status;
        this.totalGames = totalGames;
        this.activeUsers = activeUsers;
        this.releaseYear = releaseYear;
        this.developer = developer;
        this.dataSource = dataSource;
        this.logoUrl = logoUrl;
    }

    public GameSource getSource() {
        return source;
    }

    public void setSource(GameSource source) {
        this.source = source;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getTotalGames() {
        return totalGames;
    }

    public void setTotalGames(Integer totalGames) {
        this.totalGames = totalGames;
    }

    public String getActiveUsers() {
        return activeUsers;
    }

    public void setActiveUsers(String activeUsers) {
        this.activeUsers = activeUsers;
    }

    public Integer getReleaseYear() {
        return releaseYear;
    }

    public void setReleaseYear(Integer releaseYear) {
        this.releaseYear = releaseYear;
    }

    public String getDeveloper() {
        return developer;
    }

    public void setDeveloper(String developer) {
        this.developer = developer;
    }

    public String getDataSource() {
        return dataSource;
    }

    public void setDataSource(String dataSource) {
        this.dataSource = dataSource;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }
}