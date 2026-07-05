package com.ltz.game_service.entity;

import com.ltz.game_service.entity.enums.GameSource;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_review_summaries")
public class GameReviewSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Enumerated(EnumType.STRING)
    @Column(name = "source", nullable = false, length = 50)
    private GameSource source;

    @Column(name = "review_score")
    private Integer reviewScore;

    @Column(name = "review_score_desc", length = 100)
    private String reviewScoreDesc;

    @Column(name = "total_reviews")
    private Integer totalReviews;

    @Column(name = "total_positive")
    private Integer totalPositive;

    @Column(name = "total_negative")
    private Integer totalNegative;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public GameReviewSummary() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
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

    public Integer getReviewScore() {
        return reviewScore;
    }

    public void setReviewScore(Integer reviewScore) {
        this.reviewScore = reviewScore;
    }

    public String getReviewScoreDesc() {
        return reviewScoreDesc;
    }

    public void setReviewScoreDesc(String reviewScoreDesc) {
        this.reviewScoreDesc = reviewScoreDesc;
    }

    public Integer getTotalReviews() {
        return totalReviews;
    }

    public void setTotalReviews(Integer totalReviews) {
        this.totalReviews = totalReviews;
    }

    public Integer getTotalPositive() {
        return totalPositive;
    }

    public void setTotalPositive(Integer totalPositive) {
        this.totalPositive = totalPositive;
    }

    public Integer getTotalNegative() {
        return totalNegative;
    }

    public void setTotalNegative(Integer totalNegative) {
        this.totalNegative = totalNegative;
    }

    public LocalDateTime getLastSyncedAt() {
        return lastSyncedAt;
    }

    public void setLastSyncedAt(LocalDateTime lastSyncedAt) {
        this.lastSyncedAt = lastSyncedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
