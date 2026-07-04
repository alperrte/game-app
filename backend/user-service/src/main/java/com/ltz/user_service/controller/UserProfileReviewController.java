package com.ltz.user_service.controller;

import com.ltz.user_service.dto.request.CreateProfileReviewRequest;
import com.ltz.user_service.dto.response.UserProfileCommendationsSummary;
import com.ltz.user_service.dto.response.UserProfileReviewResponse;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.service.UserProfileReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileReviewController {

    private final UserProfileReviewService reviewService;

    @PostMapping("/profile/{userId}/commendations")
    public ResponseEntity<UserProfileReviewResponse> addReview(
            @PathVariable String userId,
            @Valid @RequestBody CreateProfileReviewRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        String authenticatedUserId = principal.userId().toString();
        UserProfileReviewResponse response = reviewService.createReview(authenticatedUserId, userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile/{userId}/commendations")
    public ResponseEntity<List<UserProfileReviewResponse>> getReviews(@PathVariable String userId) {
        List<UserProfileReviewResponse> response = reviewService.getReviewsForUser(userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile/{userId}/commendations/summary")
    public ResponseEntity<UserProfileCommendationsSummary> getSummary(@PathVariable String userId) {
        UserProfileCommendationsSummary response = reviewService.getCommendationsSummary(userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/profile/commendations/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        String authenticatedUserId = principal.userId().toString();
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(principal.role()) || "ADMIN".equalsIgnoreCase(principal.role());
        reviewService.deleteReview(reviewId, authenticatedUserId, isAdmin);
        return ResponseEntity.noContent().build();
    }
}
