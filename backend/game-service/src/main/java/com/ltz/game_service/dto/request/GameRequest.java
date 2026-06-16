package com.ltz.game_service.dto.request;

import com.ltz.game_service.enums.GameSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public class GameRequest {

    private GameSource source;

    private Long categoryId;

    @NotBlank(message = "Oyun adı boş bırakılamaz.")
    @Size(max = 150, message = "Oyun adı en fazla 150 karakter olabilir.")
    private String title;

    @Size(max = 3000, message = "Açıklama en fazla 3000 karakter olabilir.")
    private String description;

    @Size(max = 100, message = "Tür bilgisi en fazla 100 karakter olabilir.")
    private String genre;

    @Size(max = 100, message = "Platform bilgisi en fazla 100 karakter olabilir.")
    private String platform;

    private LocalDate releaseDate;

    @Size(max = 150, message = "Geliştirici bilgisi en fazla 150 karakter olabilir.")
    private String developer;

    @Size(max = 150, message = "Yayıncı bilgisi en fazla 150 karakter olabilir.")
    private String publisher;

    @Size(max = 2000, message = "Minimum sistem gereksinimleri en fazla 2000 karakter olabilir.")
    private String minimumSystemRequirements;

    @Size(max = 2000, message = "Önerilen sistem gereksinimleri en fazla 2000 karakter olabilir.")
    private String recommendedSystemRequirements;

    @Size(max = 500, message = "Desteklenen diller en fazla 500 karakter olabilir.")
    private String supportedLanguages;

    @Size(max = 500, message = "Kapak görseli URL bilgisi en fazla 500 karakter olabilir.")
    private String coverImageUrl;

    private Boolean earlyAccess = false;

    private Boolean onSale = false;

    private Boolean turkishLanguageSupport = false;

    private Integer popularityScore = 0;

    public GameRequest() {
    }

    public GameSource getSource() {
        return source;
    }

    public void setSource(GameSource source) {
        this.source = source;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
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

    public LocalDate getReleaseDate() {
        return releaseDate;
    }

    public void setReleaseDate(LocalDate releaseDate) {
        this.releaseDate = releaseDate;
    }

    public String getDeveloper() {
        return developer;
    }

    public void setDeveloper(String developer) {
        this.developer = developer;
    }

    public String getPublisher() {
        return publisher;
    }

    public void setPublisher(String publisher) {
        this.publisher = publisher;
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

    public Integer getPopularityScore() {
        return popularityScore;
    }

    public void setPopularityScore(Integer popularityScore) {
        this.popularityScore = popularityScore;
    }
}