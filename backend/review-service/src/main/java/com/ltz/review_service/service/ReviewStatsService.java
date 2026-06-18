package com.ltz.review_service.service;

import com.ltz.review_service.dto.response.GameRatingSummaryResponse;
import com.ltz.review_service.dto.response.ReviewResponse;
import com.ltz.review_service.entity.Review;
import com.ltz.review_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewStatsService {

    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> getTopReviewsByGameId(Long gameId) {
        return reviewRepository.findTop10ByGameIdOrderByLikeCountDescCreatedAtDesc(gameId)
                .stream()
                .map(this::mapToReviewResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GameRatingSummaryResponse getGameRatingSummary(Long gameId) {
        Double averageRating = reviewRepository.findAverageRatingByGameId(gameId);
        long reviewCount = reviewRepository.countByGameId(gameId);

        return GameRatingSummaryResponse.builder()
                .gameId(gameId)
                .averageRating(averageRating == null ? 0.0 : averageRating)
                .reviewCount(reviewCount)
                .build();
    }

    private ReviewResponse mapToReviewResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .gameId(review.getGameId())
                .userId(review.getUserId())
                .rating(review.getRating())
                .reviewText(review.getReviewText())
                .recommended(review.getRecommended())
                .playtimeHours(review.getPlaytimeHours())
                .platform(review.getPlatform())
                .hardwareInfo(review.getHardwareInfo())
                .likeCount(review.getLikeCount())
                .reportCount(review.getReportCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}