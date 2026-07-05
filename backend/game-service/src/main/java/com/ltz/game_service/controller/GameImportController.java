package com.ltz.game_service.controller;

import com.ltz.game_service.dto.response.GameImportJobResponse;
import com.ltz.game_service.entity.GameImportJob;
import com.ltz.game_service.entity.enums.GameSource;
import com.ltz.game_service.entity.enums.ImportTriggerType;
import com.ltz.game_service.repository.GameImportJobRepository;
import com.ltz.game_service.service.GameImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Sadece ADMIN: import job'larını manuel tetikleme ve geçmiş çalışmaları görüntüleme.
 * Güvenlik kuralları SecurityConfig içinde /api/games/admin/** -> ADMIN olarak tanımlıdır.
 */
@RestController
@RequestMapping("/api/games/admin/import")
public class GameImportController {

    private final GameImportService gameImportService;
    private final GameImportJobRepository gameImportJobRepository;

    public GameImportController(
            GameImportService gameImportService,
            GameImportJobRepository gameImportJobRepository
    ) {
        this.gameImportService = gameImportService;
        this.gameImportJobRepository = gameImportJobRepository;
    }

    @PostMapping
    public ResponseEntity<String> triggerImport(
            @RequestParam(defaultValue = "STEAM") GameSource source
    ) {
        gameImportService.importGamesAsync(source, ImportTriggerType.MANUAL);
        return ResponseEntity.accepted()
                .body(source + " import job başlatıldı. İlerlemeyi /api/games/admin/import/jobs üzerinden takip edebilirsiniz.");
    }

    @GetMapping("/jobs")
    public ResponseEntity<List<GameImportJobResponse>> getRecentJobs() {
        List<GameImportJobResponse> jobs = gameImportJobRepository
                .findTop20ByOrderByStartedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(jobs);
    }

    private GameImportJobResponse toResponse(GameImportJob job) {
        return new GameImportJobResponse(
                job.getId(),
                job.getSource(),
                job.getStatus(),
                job.getTriggerType(),
                job.getStartedAt(),
                job.getFinishedAt(),
                job.getFoundCount(),
                job.getAddedCount(),
                job.getUpdatedCount(),
                job.getSkippedCount(),
                job.getFailedCount(),
                job.getMessage()
        );
    }
}
