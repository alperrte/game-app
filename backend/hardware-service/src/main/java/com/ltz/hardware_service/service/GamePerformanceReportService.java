package com.ltz.hardware_service.service;

import com.ltz.hardware_service.dto.request.GamePerformanceReportCreateRequest;
import com.ltz.hardware_service.dto.request.GamePerformanceReportUpdateRequest;
import com.ltz.hardware_service.dto.response.GamePerformanceReportResponse;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.entity.GamePerformanceReport;
import com.ltz.hardware_service.repository.GamePerformanceReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GamePerformanceReportService {

    private final GamePerformanceReportRepository gamePerformanceReportRepository;
    private final HardwareComponentService hardwareComponentService;
    private final HardwareResponseMapper mapper;

    @Transactional
    public GamePerformanceReportResponse createReport(Long userId, GamePerformanceReportCreateRequest request) {
        GamePerformanceReport report = GamePerformanceReport.builder()
                .userId(userId)
                .gameId(request.getGameId())
                .reviewId(null)
                .cpuComponent(hardwareComponentService.findComponentByIdOrNull(request.getCpuComponentId()))
                .gpuComponent(hardwareComponentService.findComponentByIdOrNull(request.getGpuComponentId()))
                .ramGb(request.getRamGb())
                .resolution(request.getResolution())
                .graphicsPreset(request.getGraphicsPreset())
                .averageFps(request.getAverageFps())
                .minimumFps(request.getMinimumFps())
                .maximumFps(request.getMaximumFps())
                .rayTracingEnabled(request.getRayTracingEnabled() != null ? request.getRayTracingEnabled() : false)
                .upscalingType(request.getUpscalingType())
                .driverVersion(request.getDriverVersion())
                .notes(request.getNotes())
                .build();

        validateFpsValues(report);

        return mapper.toPerformanceReportResponse(gamePerformanceReportRepository.save(report));
    }

    public GamePerformanceReportResponse getReportById(Long id) {
        return mapper.toPerformanceReportResponse(findReportById(id));
    }

    public List<GamePerformanceReportResponse> getReportsByGame(Long gameId) {
        return gamePerformanceReportRepository.findByGameIdOrderByCreatedAtDesc(gameId)
                .stream()
                .map(mapper::toPerformanceReportResponse)
                .toList();
    }

    public List<GamePerformanceReportResponse> getReportsByUser(Long userId) {
        return gamePerformanceReportRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(mapper::toPerformanceReportResponse)
                .toList();
    }

    public List<GamePerformanceReportResponse> getReportsByGameAndGpu(Long gameId, Long gpuComponentId) {
        return gamePerformanceReportRepository.findByGameIdAndGpuComponent_IdOrderByCreatedAtDesc(gameId, gpuComponentId)
                .stream()
                .map(mapper::toPerformanceReportResponse)
                .toList();
    }

    @Transactional
    public GamePerformanceReportResponse updateReport(
            Long reportId,
            Long userId,
            GamePerformanceReportUpdateRequest request
    ) {
        GamePerformanceReport report = findReportById(reportId);

        validateReportOwner(report, userId);

        if (request.getCpuComponentId() != null) {
            report.setCpuComponent(hardwareComponentService.findComponentByIdOrNull(request.getCpuComponentId()));
        }

        if (request.getGpuComponentId() != null) {
            report.setGpuComponent(hardwareComponentService.findComponentByIdOrNull(request.getGpuComponentId()));
        }

        if (request.getRamGb() != null) {
            report.setRamGb(request.getRamGb());
        }

        if (request.getResolution() != null) {
            report.setResolution(request.getResolution());
        }

        if (request.getGraphicsPreset() != null) {
            report.setGraphicsPreset(request.getGraphicsPreset());
        }

        if (request.getAverageFps() != null) {
            report.setAverageFps(request.getAverageFps());
        }

        if (request.getMinimumFps() != null) {
            report.setMinimumFps(request.getMinimumFps());
        }

        if (request.getMaximumFps() != null) {
            report.setMaximumFps(request.getMaximumFps());
        }

        if (request.getRayTracingEnabled() != null) {
            report.setRayTracingEnabled(request.getRayTracingEnabled());
        }

        if (request.getUpscalingType() != null) {
            report.setUpscalingType(request.getUpscalingType());
        }

        if (request.getDriverVersion() != null) {
            report.setDriverVersion(request.getDriverVersion());
        }

        if (request.getNotes() != null) {
            report.setNotes(request.getNotes());
        }

        validateFpsValues(report);

        return mapper.toPerformanceReportResponse(gamePerformanceReportRepository.save(report));
    }

    @Transactional
    public MessageResponse deleteReport(Long reportId, Long userId) {
        GamePerformanceReport report = findReportById(reportId);

        validateReportOwner(report, userId);

        gamePerformanceReportRepository.delete(report);

        return MessageResponse.builder()
                .message("Performans raporu başarıyla silindi.")
                .build();
    }

    private GamePerformanceReport findReportById(Long id) {
        return gamePerformanceReportRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Performans raporu bulunamadı."));
    }

    private void validateReportOwner(GamePerformanceReport report, Long userId) {
        if (!report.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bu performans raporu üzerinde işlem yapamazsın.");
        }
    }

    private void validateFpsValues(GamePerformanceReport report) {
        Integer min = report.getMinimumFps();
        Integer avg = report.getAverageFps();
        Integer max = report.getMaximumFps();

        if (min != null && avg != null && min > avg) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum FPS, ortalama FPS değerinden büyük olamaz.");
        }

        if (avg != null && max != null && avg > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ortalama FPS, maksimum FPS değerinden büyük olamaz.");
        }

        if (min != null && max != null && min > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Minimum FPS, maksimum FPS değerinden büyük olamaz.");
        }
    }
}