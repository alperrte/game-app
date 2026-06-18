package com.ltz.review_service.controller;

import com.ltz.review_service.dto.request.ReviewLikeRequest;
import com.ltz.review_service.dto.response.ReviewLikeResponse;
import com.ltz.review_service.service.ReviewLikeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewLikeController {

    private final ReviewLikeService reviewLikeService;

    @PostMapping("/{id}/like")
    public ResponseEntity<ReviewLikeResponse> likeReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewLikeRequest request
    ) {
        ReviewLikeResponse response = reviewLikeService.likeReview(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/like")
    public ResponseEntity<ReviewLikeResponse> unlikeReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewLikeRequest request
    ) {
        ReviewLikeResponse response = reviewLikeService.unlikeReview(id, request);
        return ResponseEntity.ok(response);
    }
}