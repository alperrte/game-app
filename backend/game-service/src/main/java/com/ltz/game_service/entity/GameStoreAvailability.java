package com.ltz.game_service.entity;

import com.ltz.game_service.entity.enums.GameSource;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_store_availability")
public class GameStoreAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 50)
    private GameSource source;

    @Column(name = "store_status", length = 50)
    private String storeStatus;

    @Column(name = "is_free", nullable = false)
    private Boolean isFree = false;

    @Column(name = "price_final")
    private Integer priceFinal;

    @Column(name = "price_initial")
    private Integer priceInitial;

    @Column(name = "currency", length = 10)
    private String currency;

    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Column(name = "region", length = 10)
    private String region;

    @Column(name = "store_url", length = 500)
    private String storeUrl;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public GameStoreAvailability() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();

        if (this.isFree == null) {
            this.isFree = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();

        if (this.isFree == null) {
            this.isFree = false;
        }
    }

    public Long getId() {
        return id;
    }

    public Game getGame() {
        return game;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public GameSource getSource() {
        return source;
    }

    public void setSource(GameSource source) {
        this.source = source;
    }

    public String getStoreStatus() {
        return storeStatus;
    }

    public void setStoreStatus(String storeStatus) {
        this.storeStatus = storeStatus;
    }

    public Boolean getIsFree() {
        return isFree;
    }

    public void setIsFree(Boolean isFree) {
        this.isFree = isFree;
    }

    public Integer getPriceFinal() {
        return priceFinal;
    }

    public void setPriceFinal(Integer priceFinal) {
        this.priceFinal = priceFinal;
    }

    public Integer getPriceInitial() {
        return priceInitial;
    }

    public void setPriceInitial(Integer priceInitial) {
        this.priceInitial = priceInitial;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public Integer getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(Integer discountPercent) {
        this.discountPercent = discountPercent;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getStoreUrl() {
        return storeUrl;
    }

    public void setStoreUrl(String storeUrl) {
        this.storeUrl = storeUrl;
    }

    public LocalDateTime getLastCheckedAt() {
        return lastCheckedAt;
    }

    public void setLastCheckedAt(LocalDateTime lastCheckedAt) {
        this.lastCheckedAt = lastCheckedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
