package com.ltz.game_service.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class GameResponse {

    private Long id;
    private String title;
    private String description;
    private String genre;
    private String platform;
    private LocalDate releaseDate;
    private String developer;
    private String publisher;
    private String minimumSystemRequirements;
    private String recommendedSystemRequirements;
    private String supportedLanguages;
    private String coverImageUrl;
    private Boolean earlyAccess;
    private Boolean onSale;
    private Boolean turkishLanguageSupport;
    private Integer popularityScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GameResponse() {
    }

    public GameResponse(
            Long id,
            String title,
            String description,
            String genre,
            String platform,
            LocalDate releaseDate,
            String developer,
            String publisher,
            String minimumSystemRequirements,
            String recommendedSystemRequirements,
            String supportedLanguages,
            String coverImageUrl,
            Boolean earlyAccess,
            Boolean onSale,
            Boolean turkishLanguageSupport,
            Integer popularityScore,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.genre = genre;
        this.platform = platform;
        this.releaseDate = releaseDate;
        this.developer = developer;
        this.publisher = publisher;
        this.minimumSystemRequirements = minimumSystemRequirements;
        this.recommendedSystemRequirements = recommendedSystemRequirements;
        this.supportedLanguages = supportedLanguages;
        this.coverImageUrl = coverImageUrl;
        this.earlyAccess = earlyAccess;
        this.onSale = onSale;
        this.turkishLanguageSupport = turkishLanguageSupport;
        this.popularityScore = popularityScore;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getGenre() {
        return genre;
    }

    public String getPlatform() {
        return platform;
    }

    public LocalDate getReleaseDate() {
        return releaseDate;
    }

    public String getDeveloper() {
        return developer;
    }

    public String getPublisher() {
        return publisher;
    }

    public String getMinimumSystemRequirements() {
        return minimumSystemRequirements;
    }

    public String getRecommendedSystemRequirements() {
        return recommendedSystemRequirements;
    }

    public String getSupportedLanguages() {
        return supportedLanguages;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public Boolean getEarlyAccess() {
        return earlyAccess;
    }

    public Boolean getOnSale() {
        return onSale;
    }

    public Boolean getTurkishLanguageSupport() {
        return turkishLanguageSupport;
    }

    public Integer getPopularityScore() {
        return popularityScore;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}