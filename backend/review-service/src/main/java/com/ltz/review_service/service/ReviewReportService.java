package com.ltz.review_service.service;

import com.ltz.review_service.dto.request.ReviewReportRequest;
import com.ltz.review_service.dto.request.UpdateReviewReportStatusRequest;
import com.ltz.review_service.dto.response.ReviewReportResponse;
import com.ltz.review_service.entity.Review;
import com.ltz.review_service.entity.ReviewReport;
import com.ltz.review_service.entity.ReviewReportStatus;
import com.ltz.review_service.repository.ReviewReportRepository;
import com.ltz.review_service.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewReportService {

    private final ReviewRepository reviewRepository;
    private final ReviewReportRepository reviewReportRepository;

    @Transactional
    public ReviewReportResponse reportReview(Long reviewId, ReviewReportRequest request) {
        Review review = findReviewById(reviewId);

        ReviewReport reviewReport = ReviewReport.builder()
                .review(review)
                .userId(request.getUserId())
                .reason(request.getReason())
                .status(ReviewReportStatus.PENDING)
                .build();

        ReviewReport savedReport = reviewReportRepository.save(reviewReport);

        int currentReportCount = review.getReportCount() == null ? 0 : review.getReportCount();
        review.setReportCount(currentReportCount + 1);
        reviewRepository.save(review);

        return mapToReviewReportResponse(savedReport);
    }

    @Transactional(readOnly = true)
    public List<ReviewReportResponse> getPendingReports() {
        return reviewReportRepository.findByStatusOrderByCreatedAtDesc(ReviewReportStatus.PENDING)
                .stream()
                .map(this::mapToReviewReportResponse)
                .toList();
    }

    @Transactional
    public ReviewReportResponse updateReportStatus(Long reportId, UpdateReviewReportStatusRequest request) {
        ReviewReport reviewReport = reviewReportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Rapor bulunamadı. ID: " + reportId));

        reviewReport.setStatus(request.getStatus());

        if (request.getStatus() == ReviewReportStatus.RESOLVED
                || request.getStatus() == ReviewReportStatus.REJECTED) {
            reviewReport.setResolvedAt(LocalDateTime.now());
        }

        ReviewReport updatedReport = reviewReportRepository.save(reviewReport);

        return mapToReviewReportResponse(updatedReport);
    }

    private Review findReviewById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("İnceleme bulunamadı. ID: " + id));
    }

    private ReviewReportResponse mapToReviewReportResponse(ReviewReport reviewReport) {
        return ReviewReportResponse.builder()
                .id(reviewReport.getId())
                .reviewId(reviewReport.getReview().getId())
                .reportedByUserId(reviewReport.getUserId())
                .reason(reviewReport.getReason())
                .status(reviewReport.getStatus())
                .createdAt(reviewReport.getCreatedAt())
                .resolvedAt(reviewReport.getResolvedAt())
                .build();
    }
}