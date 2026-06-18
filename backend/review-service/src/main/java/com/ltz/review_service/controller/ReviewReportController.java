package com.ltz.review_service.controller;

import com.ltz.review_service.dto.request.ReviewReportRequest;
import com.ltz.review_service.dto.request.UpdateReviewReportStatusRequest;
import com.ltz.review_service.dto.response.ReviewReportResponse;
import com.ltz.review_service.security.JwtUserPrincipal;
import com.ltz.review_service.service.ReviewReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
public class ReviewReportController {

    private final ReviewReportService reviewReportService;

    @PostMapping("/{id}/report")
    public ResponseEntity<ReviewReportResponse> reportReview(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody ReviewReportRequest request
    ) {
        ReviewReportResponse response = reviewReportService.reportReview(id, request, requireUserId(principal));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/reports/pending")
    public ResponseEntity<List<ReviewReportResponse>> getPendingReports() {
        List<ReviewReportResponse> response = reviewReportService.getPendingReports();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/reports/{reportId}/status")
    public ResponseEntity<ReviewReportResponse> updateReportStatus(
            @PathVariable Long reportId,
            @Valid @RequestBody UpdateReviewReportStatusRequest request
    ) {
        ReviewReportResponse response = reviewReportService.updateReportStatus(reportId, request);
        return ResponseEntity.ok(response);
    }

    private Long requireUserId(JwtUserPrincipal principal) {
        if (principal == null || principal.getUserId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required.");
        }

        return principal.getUserId();
    }
}
