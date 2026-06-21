package com.ltz.hardware_service.repository;

import com.ltz.hardware_service.entity.GamePerformanceReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GamePerformanceReportRepository extends JpaRepository<GamePerformanceReport, Long> {

    List<GamePerformanceReport> findByGameIdOrderByCreatedAtDesc(Long gameId);

    List<GamePerformanceReport> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<GamePerformanceReport> findByGameIdAndGpuComponent_IdOrderByCreatedAtDesc(
            Long gameId,
            Long gpuComponentId
    );
}