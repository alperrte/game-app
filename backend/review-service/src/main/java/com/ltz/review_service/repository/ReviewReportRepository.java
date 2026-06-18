package com.ltz.review_service.repository;

import com.ltz.review_service.entity.ReviewReport;
import com.ltz.review_service.entity.ReviewReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewReportRepository extends JpaRepository<ReviewReport, Long> {

    List<ReviewReport> findByStatusOrderByCreatedAtDesc(ReviewReportStatus status);
}