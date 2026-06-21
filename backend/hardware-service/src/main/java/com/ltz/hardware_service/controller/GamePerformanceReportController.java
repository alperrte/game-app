package com.ltz.hardware_service.controller;

import com.ltz.hardware_service.dto.request.GamePerformanceReportCreateRequest;
import com.ltz.hardware_service.dto.request.GamePerformanceReportUpdateRequest;
import com.ltz.hardware_service.dto.response.GamePerformanceReportResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.service.GamePerformanceReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hardware")
@RequiredArgsConstructor
public class GamePerformanceReportController {

    private final GamePerformanceReportService gamePerformanceReportService;

    @PostMapping("/users/{userId}/performance-reports")
    @ResponseStatus(HttpStatus.CREATED)
    public GamePerformanceReportResponse createReport(
            @PathVariable Long userId,
            @Valid @RequestBody GamePerformanceReportCreateRequest request
    ) {
        return gamePerformanceReportService.createReport(userId, request);
    }

    @GetMapping("/performance-reports/{reportId}")
    public GamePerformanceReportResponse getReportById(
            @PathVariable Long reportId
    ) {
        return gamePerformanceReportService.getReportById(reportId);
    }

    @GetMapping("/performance-reports/games/{gameId}")
    public List<GamePerformanceReportResponse> getReportsByGame(
            @PathVariable Long gameId
    ) {
        return gamePerformanceReportService.getReportsByGame(gameId);
    }

    @GetMapping("/performance-reports/users/{userId}")
    public List<GamePerformanceReportResponse> getReportsByUser(
            @PathVariable Long userId
    ) {
        return gamePerformanceReportService.getReportsByUser(userId);
    }

    @GetMapping("/performance-reports/games/{gameId}/gpu/{gpuComponentId}")
    public List<GamePerformanceReportResponse> getReportsByGameAndGpu(
            @PathVariable Long gameId,
            @PathVariable Long gpuComponentId
    ) {
        return gamePerformanceReportService.getReportsByGameAndGpu(gameId, gpuComponentId);
    }

    @PutMapping("/users/{userId}/performance-reports/{reportId}")
    public GamePerformanceReportResponse updateReport(
            @PathVariable Long userId,
            @PathVariable Long reportId,
            @Valid @RequestBody GamePerformanceReportUpdateRequest request
    ) {
        return gamePerformanceReportService.updateReport(reportId, userId, request);
    }

    @DeleteMapping("/users/{userId}/performance-reports/{reportId}")
    public MessageResponse deleteReport(
            @PathVariable Long userId,
            @PathVariable Long reportId
    ) {
        return gamePerformanceReportService.deleteReport(reportId, userId);
    }
}