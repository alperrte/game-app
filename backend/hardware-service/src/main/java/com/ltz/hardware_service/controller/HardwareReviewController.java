package com.ltz.hardware_service.controller;

import com.ltz.hardware_service.dto.request.HardwareReviewCreateRequest;
import com.ltz.hardware_service.dto.request.HardwareReviewUpdateRequest;
import com.ltz.hardware_service.dto.response.HardwareReviewResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.entity.enums.HardwareReviewType;
import com.ltz.hardware_service.service.HardwareReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hardware")
@RequiredArgsConstructor
public class HardwareReviewController {

    private final HardwareReviewService hardwareReviewService;

    @PostMapping("/users/{userId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public HardwareReviewResponse createReview(
            @PathVariable Long userId,
            @Valid @RequestBody HardwareReviewCreateRequest request
    ) {
        return hardwareReviewService.createReview(userId, request);
    }

    @GetMapping("/reviews/{reviewId}")
    public HardwareReviewResponse getReviewById(
            @PathVariable Long reviewId
    ) {
        return hardwareReviewService.getReviewById(reviewId);
    }

    @GetMapping("/reviews/components/{componentId}")
    public List<HardwareReviewResponse> getReviewsByComponent(
            @PathVariable Long componentId
    ) {
        return hardwareReviewService.getReviewsByComponent(componentId);
    }

    @GetMapping("/reviews/users/{userId}")
    public List<HardwareReviewResponse> getReviewsByUser(
            @PathVariable Long userId
    ) {
        return hardwareReviewService.getReviewsByUser(userId);
    }

    @GetMapping("/reviews/type/{reviewType}")
    public List<HardwareReviewResponse> getReviewsByType(
            @PathVariable HardwareReviewType reviewType
    ) {
        return hardwareReviewService.getReviewsByType(reviewType);
    }

    @GetMapping("/reviews/components/{componentId}/type/{reviewType}")
    public List<HardwareReviewResponse> getReviewsByComponentAndType(
            @PathVariable Long componentId,
            @PathVariable HardwareReviewType reviewType
    ) {
        return hardwareReviewService.getReviewsByComponentAndType(componentId, reviewType);
    }

    @PutMapping("/users/{userId}/reviews/{reviewId}")
    public HardwareReviewResponse updateReview(
            @PathVariable Long userId,
            @PathVariable Long reviewId,
            @Valid @RequestBody HardwareReviewUpdateRequest request
    ) {
        return hardwareReviewService.updateReview(reviewId, userId, request);
    }

    @DeleteMapping("/users/{userId}/reviews/{reviewId}")
    public MessageResponse deleteReview(
            @PathVariable Long userId,
            @PathVariable Long reviewId
    ) {
        return hardwareReviewService.deleteReview(reviewId, userId);
    }
}