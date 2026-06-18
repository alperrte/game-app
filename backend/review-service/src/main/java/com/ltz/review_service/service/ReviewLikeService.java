package com.ltz.review_service.service;

import com.ltz.review_service.dto.request.ReviewLikeRequest;
import com.ltz.review_service.dto.response.ReviewLikeResponse;
import com.ltz.review_service.entity.Review;
import com.ltz.review_service.entity.ReviewLike;
import com.ltz.review_service.repository.ReviewLikeRepository;
import com.ltz.review_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewLikeService {

    private final ReviewRepository reviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;

    @Transactional
    public ReviewLikeResponse likeReview(Long reviewId, ReviewLikeRequest request) {
        Review review = findReviewById(reviewId);

        boolean alreadyLiked = reviewLikeRepository.existsByReviewIdAndUserId(
                reviewId,
                request.getUserId()
        );

        if (alreadyLiked) {
            throw new RuntimeException("Bu kullanıcı bu incelemeyi zaten beğenmiş.");
        }

        ReviewLike reviewLike = ReviewLike.builder()
                .review(review)
                .userId(request.getUserId())
                .build();

        reviewLikeRepository.save(reviewLike);

        int currentLikeCount = review.getLikeCount() == null ? 0 : review.getLikeCount();
        review.setLikeCount(currentLikeCount + 1);

        Review updatedReview = reviewRepository.save(review);

        return ReviewLikeResponse.builder()
                .reviewId(updatedReview.getId())
                .userId(request.getUserId())
                .likeCount(updatedReview.getLikeCount())
                .liked(true)
                .build();
    }

    @Transactional
    public ReviewLikeResponse unlikeReview(Long reviewId, ReviewLikeRequest request) {
        Review review = findReviewById(reviewId);

        ReviewLike reviewLike = reviewLikeRepository.findByReviewIdAndUserId(
                reviewId,
                request.getUserId()
        ).orElseThrow(() -> new RuntimeException("Bu kullanıcı bu incelemeyi beğenmemiş."));

        reviewLikeRepository.delete(reviewLike);

        int currentLikeCount = review.getLikeCount() == null ? 0 : review.getLikeCount();
        review.setLikeCount(Math.max(0, currentLikeCount - 1));

        Review updatedReview = reviewRepository.save(review);

        return ReviewLikeResponse.builder()
                .reviewId(updatedReview.getId())
                .userId(request.getUserId())
                .likeCount(updatedReview.getLikeCount())
                .liked(false)
                .build();
    }

    private Review findReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("İnceleme bulunamadı. ID: " + id));
    }
}