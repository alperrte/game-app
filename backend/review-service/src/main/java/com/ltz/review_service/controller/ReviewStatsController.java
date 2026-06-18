package com.ltz.review_service.controller;

import com.ltz.review_service.dto.response.GameRatingSummaryResponse;
import com.ltz.review_service.dto.response.ReviewResponse;
import com.ltz.review_service.service.ReviewStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewStatsController {

    private final ReviewStatsService reviewStatsService;

    @GetMapping("/game/{gameId}/top")
    public ResponseEntity<List<ReviewResponse>> getTopReviewsByGameId(@PathVariable Long gameId) {
        List<ReviewResponse> response = reviewStatsService.getTopReviewsByGameId(gameId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/game/{gameId}/average-rating")
    public ResponseEntity<GameRatingSummaryResponse> getGameRatingSummary(@PathVariable Long gameId) {
        GameRatingSummaryResponse response = reviewStatsService.getGameRatingSummary(gameId);
        return ResponseEntity.ok(response);
    }
}