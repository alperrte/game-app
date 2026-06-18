package com.ltz.review_service.service;

import com.ltz.review_service.dto.response.GameRatingSummaryResponse;
import com.ltz.review_service.dto.response.ReviewResponse;
import com.ltz.review_service.entity.Review;
import com.ltz.review_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReviewStatsService {

    private static final String GAME_SOURCE_INTERNAL = "INTERNAL";
    private static final String GAME_SOURCE_STEAM = "STEAM";
    private static final String GAME_SOURCE_EPIC = "EPIC";

    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getTopReviewsByGameId(Long gameId) {
        return reviewRepository
                .findTop10ByGameSourceAndGameIdOrderByLikeCountDescCreatedAtDesc(
                        GAME_SOURCE_INTERNAL,
                        gameId
                )
                .stream()
                .map(this::mapToReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getTopReviewsByExternalGame(
            String gameSource,
            String externalGameId
    ) {
        String normalizedGameSource = normalizeExternalGameSource(gameSource);
        String normalizedExternalGameId = normalizeExternalGameId(externalGameId);

        return reviewRepository
                .findTop10ByGameSourceAndExternalGameIdOrderByLikeCountDescCreatedAtDesc(
                        normalizedGameSource,
                        normalizedExternalGameId
                )
                .stream()
                .map(this::mapToReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GameRatingSummaryResponse getGameRatingSummary(Long gameId) {
        Double averageRating = reviewRepository.findAverageRatingByGameSourceAndGameId(
                GAME_SOURCE_INTERNAL,
                gameId
        );
        long reviewCount = reviewRepository.countByGameSourceAndGameId(
                GAME_SOURCE_INTERNAL,
                gameId
        );

        return GameRatingSummaryResponse.builder()
                .gameId(gameId)
                .averageRating(averageRating == null ? 0.0 : averageRating)
                .reviewCount(reviewCount)
                .build();
    }

    @Transactional(readOnly = true)
    public GameRatingSummaryResponse getExternalGameRatingSummary(
            String gameSource,
            String externalGameId
    ) {
        String normalizedGameSource = normalizeExternalGameSource(gameSource);
        String normalizedExternalGameId = normalizeExternalGameId(externalGameId);

        Double averageRating = reviewRepository.findAverageRatingByGameSourceAndExternalGameId(
                normalizedGameSource,
                normalizedExternalGameId
        );
        long reviewCount = reviewRepository.countByGameSourceAndExternalGameId(
                normalizedGameSource,
                normalizedExternalGameId
        );

        return GameRatingSummaryResponse.builder()
                .gameId(null)
                .averageRating(averageRating == null ? 0.0 : averageRating)
                .reviewCount(reviewCount)
                .build();
    }

    private String normalizeExternalGameSource(String gameSource) {
        if (gameSource == null || gameSource.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "External game source is required."
            );
        }

        String normalizedGameSource = gameSource.trim().toUpperCase(Locale.ROOT);

        if (
                GAME_SOURCE_STEAM.equals(normalizedGameSource)
                        || GAME_SOURCE_EPIC.equals(normalizedGameSource)
        ) {
            return normalizedGameSource;
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "External game source must be STEAM or EPIC."
        );
    }

    private String normalizeExternalGameId(String externalGameId) {
        if (externalGameId == null || externalGameId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "External game ID is required."
            );
        }

        return externalGameId.trim();
    }

    private ReviewResponse mapToReviewResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .gameSource(review.getGameSource())
                .gameId(review.getGameId())
                .externalGameId(review.getExternalGameId())
                .userId(review.getUserId())
                .rating(review.getRating())
                .reviewText(review.getReviewText())
                .recommended(review.getRecommended())
                .playtimeHours(review.getPlaytimeHours())
                .playtimeMinutes(review.getPlaytimeMinutes())
                .platform(review.getPlatform())
                .hardwareInfo(review.getHardwareInfo())
                .likeCount(review.getLikeCount())
                .reportCount(review.getReportCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}