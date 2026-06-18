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

    private Long gameId;

    private Long userId;

    private Integer rating;

    private String reviewText;

    private Boolean recommended;

    private Integer playtimeHours;

    private String platform;

    private String hardwareInfo;

    private Integer likeCount;

    private Integer reportCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}