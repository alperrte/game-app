package com.ltz.game_service.dto.response.external;

import com.ltz.game_service.entity.enums.GameSource;

public class ExternalGameDetailResponse {

    private GameSource source;
    private String externalId;

    private String title;
    private String description;
    private String genre;
    private String platform;
    private String releaseDate;
    private String developer;
    private String minimumSystemRequirements;
    private String recommendedSystemRequirements;
    private String supportedLanguages;
    private String coverImageUrl;

    private Boolean earlyAccess;
    private Boolean onSale;
    private Boolean turkishLanguageSupport;

    public ExternalGameDetailResponse() {
    }

    public ExternalGameDetailResponse(
            GameSource source,
            String externalId,
            String title,
            String description,
            String genre,
            String platform,
            String releaseDate,
            String developer,
            String minimumSystemRequirements,
            String recommendedSystemRequirements,
            String supportedLanguages,
            String coverImageUrl,
            Boolean earlyAccess,
            Boolean onSale,
            Boolean turkishLanguageSupport
    ) {
        this.source = source;
        this.externalId = externalId;
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
        this.earlyAccess = earlyAccess;
        this.onSale = onSale;
        this.turkishLanguageSupport = turkishLanguageSupport;
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

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getGenre() {
        return genre;
    }

    public void setGenre(String genre) {
        this.genre = genre;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(String releaseDate) {
        this.releaseDate = releaseDate;
    }

    public String getDeveloper() {
        return developer;
    }

    public void setDeveloper(String developer) {
        this.developer = developer;
    }

    public String getMinimumSystemRequirements() {
        return minimumSystemRequirements;
    }

    public void setMinimumSystemRequirements(String minimumSystemRequirements) {
        this.minimumSystemRequirements = minimumSystemRequirements;
    }

    public String getRecommendedSystemRequirements() {
        return recommendedSystemRequirements;
    }

    public void setRecommendedSystemRequirements(String recommendedSystemRequirements) {
        this.recommendedSystemRequirements = recommendedSystemRequirements;
    }

    public String getSupportedLanguages() {
        return supportedLanguages;
    }

    public void setSupportedLanguages(String supportedLanguages) {
        this.supportedLanguages = supportedLanguages;
    }

    public String getCoverImageUrl() {
        return coverImageUrl;
    }

    public void setCoverImageUrl(String coverImageUrl) {
        this.coverImageUrl = coverImageUrl;
    }

    public Boolean getEarlyAccess() {
        return earlyAccess;
    }

    public void setEarlyAccess(Boolean earlyAccess) {
        this.earlyAccess = earlyAccess;
    }

    public Boolean getOnSale() {
        return onSale;
    }

    public void setOnSale(Boolean onSale) {
        this.onSale = onSale;
    }

    public Boolean getTurkishLanguageSupport() {
        return turkishLanguageSupport;
    }

    public void setTurkishLanguageSupport(Boolean turkishLanguageSupport) {
        this.turkishLanguageSupport = turkishLanguageSupport;
    }
}