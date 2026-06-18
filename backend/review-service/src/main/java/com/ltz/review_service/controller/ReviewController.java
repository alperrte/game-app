package com.ltz.review_service.controller;

import com.ltz.review_service.dto.request.CreateReviewRequest;
import com.ltz.review_service.dto.request.UpdateReviewRequest;
import com.ltz.review_service.dto.response.ReviewResponse;
import com.ltz.review_service.security.JwtUserPrincipal;
import com.ltz.review_service.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        ReviewResponse response = reviewService.createReview(request, requireUserId(principal));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponse> getReviewById(@PathVariable Long id) {
        ReviewResponse response = reviewService.getReviewById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/game/{gameId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByGameId(@PathVariable Long gameId) {
        List<ReviewResponse> response = reviewService.getReviewsByGameId(gameId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUserId(@PathVariable Long userId) {
        List<ReviewResponse> response = reviewService.getReviewsByUserId(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponse> updateReview(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody UpdateReviewRequest request
    ) {
        ReviewResponse response = reviewService.updateReview(
                id,
                request,
                requireUserId(principal),
                principal.getRole()
        );
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id
    ) {
        reviewService.deleteReview(id, requireUserId(principal), principal.getRole());
        return ResponseEntity.noContent().build();
    }

    private Long requireUserId(JwtUserPrincipal principal) {
        if (principal == null || principal.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        return principal.getUserId();
    }
}
