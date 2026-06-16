package com.ltz.game_service.entity;

import com.ltz.game_service.enums.GameSource;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 50)
    private GameSource source;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private GameCategory category;

    @NotBlank(message = "Oyun adı boş bırakılamaz.")
    @Size(max = 150, message = "Oyun adı en fazla 150 karakter olabilir.")
    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Size(max = 3000, message = "Açıklama en fazla 3000 karakter olabilir.")
    @Column(name = "description", length = 3000)
    private String description;

    @Size(max = 100, message = "Tür bilgisi en fazla 100 karakter olabilir.")
    @Column(name = "genre", length = 100)
    private String genre;

    @Size(max = 100, message = "Platform bilgisi en fazla 100 karakter olabilir.")
    @Column(name = "platform", length = 100)
    private String platform;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Size(max = 150, message = "Geliştirici bilgisi en fazla 150 karakter olabilir.")
    @Column(name = "developer", length = 150)
    private String developer;

    @Size(max = 150, message = "Yayıncı bilgisi en fazla 150 karakter olabilir.")
    @Column(name = "publisher", length = 150)
    private String publisher;

    @Size(max = 2000, message = "Minimum sistem gereksinimleri en fazla 2000 karakter olabilir.")
    @Column(name = "minimum_system_requirements", length = 2000)
    private String minimumSystemRequirements;

    @Size(max = 2000, message = "Önerilen sistem gereksinimleri en fazla 2000 karakter olabilir.")
    @Column(name = "recommended_system_requirements", length = 2000)
    private String recommendedSystemRequirements;

    @Size(max = 500, message = "Desteklenen diller en fazla 500 karakter olabilir.")
    @Column(name = "supported_languages", length = 500)
    private String supportedLanguages;

    @Size(max = 500, message = "Kapak görseli URL bilgisi en fazla 500 karakter olabilir.")
    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;

    @Column(name = "early_access", nullable = false)
    private Boolean earlyAccess = false;

    @Column(name = "on_sale", nullable = false)
    private Boolean onSale = false;

    @Column(name = "turkish_language_support", nullable = false)
    private Boolean turkishLanguageSupport = false;

    @Column(name = "popularity_score", nullable = false)
    private Integer popularityScore = 0;

    @Column(name = "system_requirement_only", nullable = false)
    private Boolean systemRequirementOnly = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Game() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();

        if (this.earlyAccess == null) {
            this.earlyAccess = false;
        }

        if (this.onSale == null) {
            this.onSale = false;
        }

        if (this.turkishLanguageSupport == null) {
            this.turkishLanguageSupport = false;
        }

        if (this.popularityScore == null) {
            this.popularityScore = 0;
        }

        if (this.systemRequirementOnly == null) {
            this.systemRequirementOnly = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();

        if (this.earlyAccess == null) {
            this.earlyAccess = false;
        }

        if (this.onSale == null) {
            this.onSale = false;
        }

        if (this.turkishLanguageSupport == null) {
            this.turkishLanguageSupport = false;
        }

        if (this.popularityScore == null) {
            this.popularityScore = 0;
        }

        if (this.systemRequirementOnly == null) {
            this.systemRequirementOnly = false;
        }
    }

    public Long getId() {
        return id;
    }

    public GameSource getSource() {
        return source;
    }

    public void setSource(GameSource source) {
        this.source = source;
    }

    public GameCategory getCategory() {
        return category;
    }

    public void setCategory(GameCategory category) {
        this.category = category;
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

    public Boolean getSystemRequirementOnly() {
        return systemRequirementOnly;
    }

    public void setSystemRequirementOnly(Boolean systemRequirementOnly) {
        this.systemRequirementOnly = systemRequirementOnly;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
