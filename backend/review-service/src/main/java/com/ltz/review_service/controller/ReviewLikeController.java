package com.ltz.review_service.controller;

import com.ltz.review_service.dto.response.ReviewLikeResponse;
import com.ltz.review_service.security.JwtUserPrincipal;
import com.ltz.review_service.service.ReviewLikeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewLikeController {

    private final ReviewLikeService reviewLikeService;

    @PostMapping("/{id}/like")
    public ResponseEntity<ReviewLikeResponse> likeReview(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id
    ) {
        ReviewLikeResponse response = reviewLikeService.likeReview(id, requireUserId(principal));
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<ReviewLikeResponse> unlikeReview(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id
    ) {
        ReviewLikeResponse response = reviewLikeService.unlikeReview(id, requireUserId(principal));
        return ResponseEntity.ok(response);
    }

    private Long requireUserId(JwtUserPrincipal principal) {
        if (principal == null || principal.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        return principal.getUserId();
    }
}
