package com.ltz.review_service.service;

import com.ltz.review_service.dto.request.CreateReviewRequest;
import com.ltz.review_service.dto.request.UpdateReviewRequest;
import com.ltz.review_service.dto.response.ReviewResponse;
import com.ltz.review_service.entity.Review;
import com.ltz.review_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request) {
        boolean alreadyReviewed = reviewRepository.existsByGameIdAndUserId(
                request.getGameId(),
                request.getUserId()
        );

        if (alreadyReviewed) {
            throw new RuntimeException("Bu kullanıcı bu oyun için zaten inceleme yazmış.");
        }

        Review review = Review.builder()
                .gameId(request.getGameId())
                .userId(request.getUserId())
                .rating(request.getRating())
                .reviewText(request.getReviewText())
                .recommended(request.getRecommended())
                .playtimeHours(request.getPlaytimeHours())
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
        return reviewRepository.findByGameIdOrderByCreatedAtDesc(gameId)
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

    @Transactional
    public ReviewResponse updateReview(Long id, UpdateReviewRequest request) {
        Review review = findReviewById(id);

        review.setRating(request.getRating());
        review.setReviewText(request.getReviewText());
        review.setRecommended(request.getRecommended());
        review.setPlaytimeHours(request.getPlaytimeHours());
        review.setPlatform(request.getPlatform());
        review.setHardwareInfo(request.getHardwareInfo());

        Review updatedReview = reviewRepository.save(review);

        return mapToReviewResponse(updatedReview);
    }

    @Transactional
    public void deleteReview(Long id) {
        Review review = findReviewById(id);
        reviewRepository.delete(review);
    }

    private Review findReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("İnceleme bulunamadı. ID: " + id));
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