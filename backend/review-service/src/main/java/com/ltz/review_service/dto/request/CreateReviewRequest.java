package com.ltz.review_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateReviewRequest {

    @Size(max = 30, message = "Game source can be at most 30 characters.")
    private String gameSource;

    private Long gameId;

    @Size(max = 100, message = "External game ID can be at most 100 characters.")
    private String externalGameId;

    @NotNull(message = "Rating is required.")
    @Min(value = 1, message = "Rating must be at least 1.")
    @Max(value = 10, message = "Rating must be at most 10.")
    private Integer rating;

    @NotBlank(message = "Review text is required.")
    @Size(max = 3000, message = "Review text can be at most 3000 characters.")
    private String reviewText;

    @NotNull(message = "Recommendation value is required.")
    private Boolean recommended;

    @PositiveOrZero(message = "Playtime hours cannot be negative.")
    private Integer playtimeHours;

    @Min(value = 0, message = "Playtime minutes must be at least 0.")
    @Max(value = 59, message = "Playtime minutes must be at most 59.")
    private Integer playtimeMinutes;

    @Size(max = 100, message = "Platform can be at most 100 characters.")
    private String platform;

    @Size(max = 500, message = "Hardware info can be at most 500 characters.")
    private String hardwareInfo;
}