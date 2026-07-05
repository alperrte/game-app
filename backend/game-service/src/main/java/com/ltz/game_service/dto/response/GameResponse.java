package com.ltz.game_service.dto.response;

import com.ltz.game_service.entity.enums.GameSource;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class GameResponse {

    private Long id;
    private GameSource source;
    private Long categoryId;
    private String categoryName;
    private String title;
    private String description;
    private String genre;
    private String platform;
    private LocalDate releaseDate;
    private String developer;
    private String minimumSystemRequirements;
    private String recommendedSystemRequirements;
    private String supportedLanguages;
    private String coverImageUrl;
    private String storeUrl;
    private Boolean earlyAccess;
    private Boolean onSale;
    private Boolean turkishLanguageSupport;
    private Integer popularityScore;
    private Boolean systemRequirementOnly;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GameResponse() {
    }

    public GameResponse(
            Long id,
            GameSource source,
            Long categoryId,
            String categoryName,
            String title,
            String description,
            String genre,
            String platform,
            LocalDate releaseDate,
            String developer,
            String minimumSystemRequirements,
            String recommendedSystemRequirements,
            String supportedLanguages,
            String coverImageUrl,
            String storeUrl,
            Boolean earlyAccess,
            Boolean onSale,
            Boolean turkishLanguageSupport,
            Integer popularityScore,
            Boolean systemRequirementOnly,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        this.id = id;
        this.source = source;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.title = title;
        this.description = description;
        this.genre = genre;
        this.platform = platform;
        this.releaseDate = releaseDate;
        this.developer = developer;
        this.minimumSystemRequirements = minimumSystemRequirements;
        this.recommendedSystemRequirements = recommendedSystemRequirements;
        this.supportedLanguages = supportedLanguages;
        this.coverImageUrl = coverImageUrl;
        this.storeUrl = storeUrl;
        this.earlyAccess = earlyAccess;
        this.onSale = onSale;
        this.turkishLanguageSupport = turkishLanguageSupport;
        this.popularityScore = popularityScore;
        this.systemRequirementOnly = systemRequirementOnly;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public GameSource getSource() {
        return source;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public String getCategoryName() {
        return categoryName;
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

    public String getStoreUrl() {
        return storeUrl;
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

    public Boolean getSystemRequirementOnly() {
        return systemRequirementOnly;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
