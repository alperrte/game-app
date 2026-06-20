package com.ltz.review_service.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ReviewResponse {

    private Long id;

    private String gameSource;

    private Long gameId;

    private String externalGameId;

    private Long userId;

    private Integer rating;

    private String reviewText;

    private String graphicsReview;

    private String gameplayReview;

    private String storyReview;

    private String performanceReview;

    private String pros;

    private String cons;

    private Boolean recommended;

    private Integer playtimeHours;

    private Integer playtimeMinutes;

    private String platform;

    private String hardwareInfo;

    private Integer likeCount;

    private Integer reportCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}