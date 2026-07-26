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
import com.ltz.user_service.dto.request.ReportReviewRequest;
import com.ltz.user_service.exception.BadRequestException;
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
        // TODO: Gelecekte MODERATOR rolünün de yorumları silebilmesi için "|| "MODERATOR".equalsIgnoreCase(principal.role())" eklenebilir.
        boolean isAdmin = "ROLE_ADMIN".equalsIgnoreCase(principal.role()) || "ADMIN".equalsIgnoreCase(principal.role());
        reviewService.deleteReview(reviewId, authenticatedUserId, isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/profile/commendations/{reviewId}/report")
    public ResponseEntity<Void> reportReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReportReviewRequest request) {
        reviewService.reportReview(reviewId, request.getReason());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/profile/commendations/reported")
    public ResponseEntity<List<UserProfileReviewResponse>> getReportedReviews(
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        // TODO: Gelecekte MODERATOR rolünün de şikayet listesini görebilmesi için koşula MODERATOR kontrolü eklenebilir.
        if (!"ROLE_ADMIN".equalsIgnoreCase(principal.role()) && !"ADMIN".equalsIgnoreCase(principal.role())) {
            throw new BadRequestException("Only administrators can view reported reviews");
        }
        return ResponseEntity.ok(reviewService.getReportedReviews());
    }

    @PostMapping("/profile/commendations/{reviewId}/resolve")
    public ResponseEntity<Void> resolveReport(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        // TODO: Gelecekte MODERATOR rolünün de şikayeti çözebilmesi için koşula MODERATOR kontrolü eklenebilir.
        if (!"ROLE_ADMIN".equalsIgnoreCase(principal.role()) && !"ADMIN".equalsIgnoreCase(principal.role())) {
            throw new BadRequestException("Only administrators can resolve reports");
        }
        reviewService.resolveReport(reviewId);
        return ResponseEntity.ok().build();
    }
}
