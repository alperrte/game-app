package com.ltz.review_service.service;

import com.ltz.review_service.dto.response.ReviewLikeResponse;
import com.ltz.review_service.entity.Review;
import com.ltz.review_service.entity.ReviewLike;
import com.ltz.review_service.repository.ReviewLikeRepository;
import com.ltz.review_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ReviewLikeService {

    private final ReviewRepository reviewRepository;
    private final ReviewLikeRepository reviewLikeRepository;

    @Transactional
    public ReviewLikeResponse likeReview(Long reviewId, Long authenticatedUserId) {
        Review review = findReviewById(reviewId);

        boolean alreadyLiked = reviewLikeRepository.existsByReviewIdAndUserId(
                reviewId,
                authenticatedUserId
        );

        if (alreadyLiked) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This user has already liked this review."
            );
        }

        ReviewLike reviewLike = ReviewLike.builder()
                .review(review)
                .userId(authenticatedUserId)
                .build();

        reviewLikeRepository.save(reviewLike);

        int currentLikeCount = review.getLikeCount() == null ? 0 : review.getLikeCount();
        review.setLikeCount(currentLikeCount + 1);

        Review updatedReview = reviewRepository.save(review);

        return ReviewLikeResponse.builder()
                .reviewId(updatedReview.getId())
                .userId(authenticatedUserId)
                .likeCount(updatedReview.getLikeCount())
                .liked(true)
                .build();
    }

    @Transactional
    public ReviewLikeResponse unlikeReview(Long reviewId, Long authenticatedUserId) {
        Review review = findReviewById(reviewId);

        ReviewLike reviewLike = reviewLikeRepository.findByReviewIdAndUserId(
                reviewId,
                authenticatedUserId
        ).orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "This user has not liked this review."
        ));

        reviewLikeRepository.delete(reviewLike);

        int currentLikeCount = review.getLikeCount() == null ? 0 : review.getLikeCount();
        review.setLikeCount(Math.max(0, currentLikeCount - 1));

        Review updatedReview = reviewRepository.save(review);

        return ReviewLikeResponse.builder()
                .reviewId(updatedReview.getId())
                .userId(authenticatedUserId)
                .likeCount(updatedReview.getLikeCount())
                .liked(false)
                .build();
    }

    private Review findReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Review not found. ID: " + id
                ));
    }
}
