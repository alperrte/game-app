package com.ltz.review_service.service;

import com.ltz.review_service.dto.request.CreateReviewRequest;
import com.ltz.review_service.dto.request.UpdateReviewRequest;
import com.ltz.review_service.dto.response.ReviewResponse;
import com.ltz.review_service.entity.Review;
import com.ltz.review_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final String GAME_SOURCE_INTERNAL = "INTERNAL";
    private static final String GAME_SOURCE_STEAM = "STEAM";
    private static final String GAME_SOURCE_EPIC = "EPIC";

    private final ReviewRepository reviewRepository;

    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request, Long authenticatedUserId) {
        String gameSource = normalizeGameSource(request.getGameSource());
        Long gameId = resolveGameId(gameSource, request.getGameId());
        String externalGameId = resolveExternalGameId(
                gameSource,
                request.getExternalGameId()
        );

        boolean alreadyReviewed = isAlreadyReviewed(
                gameSource,
                gameId,
                externalGameId,
                authenticatedUserId
        );

        if (alreadyReviewed) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This user has already reviewed this game."
            );
        }

        Review review = Review.builder()
                .gameSource(gameSource)
                .gameId(gameId)
                .externalGameId(externalGameId)
                .userId(authenticatedUserId)
                .rating(request.getRating())
                .reviewText(request.getReviewText())
                .recommended(request.getRecommended())
                .playtimeHours(request.getPlaytimeHours())
                .playtimeMinutes(request.getPlaytimeMinutes())
                .platform(request.getPlatform())
                .hardwareInfo(request.getHardwareInfo())
                .likeCount(0)
                .reportCount(0)
                .build();

        Review savedReview = reviewRepository.save(review);

        return mapToReviewResponse(savedReview);
    }

    @Transactional(readOnly = true)
    public ReviewResponse getReviewById(Long id) {
        Review review = findReviewById(id);
        return mapToReviewResponse(review);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByGameId(Long gameId) {
        return reviewRepository.findByGameSourceAndGameIdOrderByCreatedAtDesc(
                        GAME_SOURCE_INTERNAL,
                        gameId
                )
                .stream()
                .map(this::mapToReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByExternalGame(
            String gameSource,
            String externalGameId
    ) {
        String normalizedGameSource = normalizeExternalGameSource(gameSource);
        String normalizedExternalGameId = normalizeExternalGameId(externalGameId);

        return reviewRepository.findByGameSourceAndExternalGameIdOrderByCreatedAtDesc(
                        normalizedGameSource,
                        normalizedExternalGameId
                )
                .stream()
                .map(this::mapToReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getReviewsByUserId(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getTopReviewsByGameId(Long gameId) {
        return reviewRepository.findTop10ByGameSourceAndGameIdOrderByLikeCountDescCreatedAtDesc(
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

        return reviewRepository.findTop10ByGameSourceAndExternalGameIdOrderByLikeCountDescCreatedAtDesc(
                        normalizedGameSource,
                        normalizedExternalGameId
                )
                .stream()
                .map(this::mapToReviewResponse)
                .toList();
    }

    @Transactional
    public ReviewResponse updateReview(
            Long id,
            UpdateReviewRequest request,
            Long authenticatedUserId,
            String role
    ) {
        Review review = findReviewById(id);
        assertOwnerOrModerator(review, authenticatedUserId, role);

        review.setRating(request.getRating());
        review.setReviewText(request.getReviewText());
        review.setRecommended(request.getRecommended());
        review.setPlaytimeHours(request.getPlaytimeHours());
        review.setPlaytimeMinutes(request.getPlaytimeMinutes());
        review.setPlatform(request.getPlatform());
        review.setHardwareInfo(request.getHardwareInfo());

        Review updatedReview = reviewRepository.save(review);

        return mapToReviewResponse(updatedReview);
    }

    @Transactional
    public void deleteReview(Long id, Long authenticatedUserId, String role) {
        Review review = findReviewById(id);
        assertOwnerOrModerator(review, authenticatedUserId, role);
        reviewRepository.delete(review);
    }

    private boolean isAlreadyReviewed(
            String gameSource,
            Long gameId,
            String externalGameId,
            Long authenticatedUserId
    ) {
        if (GAME_SOURCE_INTERNAL.equals(gameSource)) {
            return reviewRepository.existsByGameSourceAndGameIdAndUserId(
                    gameSource,
                    gameId,
                    authenticatedUserId
            );
        }

        return reviewRepository.existsByGameSourceAndExternalGameIdAndUserId(
                gameSource,
                externalGameId,
                authenticatedUserId
        );
    }

    private String normalizeGameSource(String gameSource) {
        if (gameSource == null || gameSource.isBlank()) {
            return GAME_SOURCE_INTERNAL;
        }

        String normalizedGameSource = gameSource.trim().toUpperCase(Locale.ROOT);

        if (
                GAME_SOURCE_INTERNAL.equals(normalizedGameSource)
                        || GAME_SOURCE_STEAM.equals(normalizedGameSource)
                        || GAME_SOURCE_EPIC.equals(normalizedGameSource)
        ) {
            return normalizedGameSource;
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Invalid game source. Allowed values are INTERNAL, STEAM, EPIC."
        );
    }

    private String normalizeExternalGameSource(String gameSource) {
        String normalizedGameSource = normalizeGameSource(gameSource);

        if (GAME_SOURCE_INTERNAL.equals(normalizedGameSource)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "External game source must be STEAM or EPIC."
            );
        }

        return normalizedGameSource;
    }

    private Long resolveGameId(String gameSource, Long gameId) {
        if (GAME_SOURCE_INTERNAL.equals(gameSource)) {
            if (gameId == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Game ID is required for internal games."
                );
            }

            return gameId;
        }

        return null;
    }

    private String resolveExternalGameId(String gameSource, String externalGameId) {
        if (GAME_SOURCE_INTERNAL.equals(gameSource)) {
            return null;
        }

        return normalizeExternalGameId(externalGameId);
    }

    private String normalizeExternalGameId(String externalGameId) {
        if (externalGameId == null || externalGameId.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "External game ID is required for external games."
            );
        }

        return externalGameId.trim();
    }

    private Review findReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Review not found. ID: " + id
                ));
    }

    private void assertOwnerOrModerator(Review review, Long authenticatedUserId, String role) {
        if (review.getUserId().equals(authenticatedUserId) || isModeratorRole(role)) {
            return;
        }

        throw new AccessDeniedException("You are not allowed to modify this review.");
    }

    private boolean isModeratorRole(String role) {
        if (role == null || role.isBlank()) {
            return false;
        }

        String normalizedRole = role.toUpperCase().replace("ROLE_", "");
        return "ADMIN".equals(normalizedRole) || "MODERATOR".equals(normalizedRole);
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