package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.CreateProfileReviewRequest;
import com.ltz.user_service.dto.response.UserProfileCommendationsSummary;
import com.ltz.user_service.dto.response.UserProfileReviewResponse;
import com.ltz.user_service.entity.UserProfileReview;
import com.ltz.user_service.entity.UserProfile;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.repository.UserProfileReviewRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserProfileReviewService {

    private final UserProfileReviewRepository reviewRepository;
    private final UserProfileRepository profileRepository;

    @Transactional
    public UserProfileReviewResponse createReview(String reviewerId, String reviewedId, CreateProfileReviewRequest request) {
        if (reviewerId.equals(reviewedId)) {
            throw new BadRequestException("You cannot review your own profile");
        }

        // Check if profile exists
        profileRepository.findByUserId(reviewedId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found to review"));

        UserProfile reviewerProfile = profileRepository.findByUserId(reviewerId)
                .orElseThrow(() -> new ResourceNotFoundException("Reviewer profile not found"));

        if (reviewRepository.existsByReviewerIdAndReviewedId(reviewerId, reviewedId)) {
            throw new BadRequestException("You have already reviewed this player. You can delete or edit your existing review.");
        }

        UserProfileReview review = UserProfileReview.builder()
                .reviewerId(reviewerId)
                .reviewerUsername(reviewerProfile.getUsername())
                .reviewerDisplayName(reviewerProfile.getDisplayName())
                .reviewerAvatarUrl(reviewerProfile.getAvatarUrl())
                .reviewedId(reviewedId)
                .content(request.getContent())
                .friendlyPoint(request.isFriendlyPoint())
                .leaderPoint(request.isLeaderPoint())
                .aimGodPoint(request.isAimGodPoint())
                .tacticianPoint(request.isTacticianPoint())
                .createdAt(LocalDateTime.now())
                .build();

        UserProfileReview saved = reviewRepository.save(review);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<UserProfileReviewResponse> getReviewsForUser(String reviewedId) {
        return reviewRepository.findByReviewedIdOrderByCreatedAtDesc(reviewedId).stream()
                .map(review -> {
                    UserProfile reviewerProfile = profileRepository.findByUserId(review.getReviewerId()).orElse(null);
                    UserProfileReviewResponse.UserProfileReviewResponseBuilder builder = UserProfileReviewResponse.builder()
                            .id(review.getId())
                            .reviewerId(review.getReviewerId())
                            .reviewedId(review.getReviewedId())
                            .content(review.getContent())
                            .friendlyPoint(review.isFriendlyPoint())
                            .leaderPoint(review.isLeaderPoint())
                            .aimGodPoint(review.isAimGodPoint())
                            .tacticianPoint(review.isTacticianPoint())
                            .createdAt(review.getCreatedAt());

                    if (reviewerProfile != null) {
                        builder.reviewerUsername(reviewerProfile.getUsername())
                               .reviewerDisplayName(reviewerProfile.getDisplayName())
                               .reviewerAvatarUrl(reviewerProfile.getAvatarUrl());
                    } else {
                        builder.reviewerUsername(review.getReviewerUsername())
                               .reviewerDisplayName(review.getReviewerDisplayName())
                               .reviewerAvatarUrl(review.getReviewerAvatarUrl());
                    }
                    return builder.build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public UserProfileCommendationsSummary getCommendationsSummary(String reviewedId) {
        return UserProfileCommendationsSummary.builder()
                .totalReviews(reviewRepository.countByReviewedId(reviewedId))
                .friendlyCount(reviewRepository.countFriendlyPoints(reviewedId))
                .leaderCount(reviewRepository.countLeaderPoints(reviewedId))
                .aimGodCount(reviewRepository.countAimGodPoints(reviewedId))
                .tacticianCount(reviewRepository.countTacticianPoints(reviewedId))
                .build();
    }

    @Transactional
    public void deleteReview(Long reviewId, String authenticatedUserId, boolean isAdmin) {
        UserProfileReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));

        // Only reviewer, profile owner, or Admin can delete a review
        if (!review.getReviewerId().equals(authenticatedUserId) 
                && !review.getReviewedId().equals(authenticatedUserId) 
                && !isAdmin) {
            throw new BadRequestException("You are not authorized to delete this review");
        }

        reviewRepository.delete(review);
    }

    private UserProfileReviewResponse mapToResponse(UserProfileReview review) {
        return UserProfileReviewResponse.builder()
                .id(review.getId())
                .reviewerId(review.getReviewerId())
                .reviewerUsername(review.getReviewerUsername())
                .reviewerDisplayName(review.getReviewerDisplayName())
                .reviewerAvatarUrl(review.getReviewerAvatarUrl())
                .reviewedId(review.getReviewedId())
                .content(review.getContent())
                .friendlyPoint(review.isFriendlyPoint())
                .leaderPoint(review.isLeaderPoint())
                .aimGodPoint(review.isAimGodPoint())
                .tacticianPoint(review.isTacticianPoint())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
