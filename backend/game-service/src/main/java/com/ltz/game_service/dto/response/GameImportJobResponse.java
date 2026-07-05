package com.ltz.game_service.dto.response;

import com.ltz.game_service.entity.enums.GameSource;
import com.ltz.game_service.entity.enums.ImportStatus;
import com.ltz.game_service.entity.enums.ImportTriggerType;

import java.time.LocalDateTime;

public class GameImportJobResponse {

    private Long id;
    private GameSource source;
    private ImportStatus status;
    private ImportTriggerType triggerType;
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;
    private Integer foundCount;
    private Integer addedCount;
    private Integer updatedCount;
    private Integer skippedCount;
    private Integer failedCount;
    private String message;

    public GameImportJobResponse() {
    }

    public GameImportJobResponse(
            Long id,
            GameSource source,
            ImportStatus status,
            ImportTriggerType triggerType,
            LocalDateTime startedAt,
            LocalDateTime finishedAt,
            Integer foundCount,
            Integer addedCount,
            Integer updatedCount,
            Integer skippedCount,
            Integer failedCount,
            String message
    ) {
        this.id = id;
        this.source = source;
        this.status = status;
        this.triggerType = triggerType;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
        this.foundCount = foundCount;
        this.addedCount = addedCount;
        this.updatedCount = updatedCount;
        this.skippedCount = skippedCount;
        this.failedCount = failedCount;
        this.message = message;
    }

    public Long getId() {
        return id;
    }

    public GameSource getSource() {
        return source;
    }

    public ImportStatus getStatus() {
        return status;
    }

    public ImportTriggerType getTriggerType() {
        return triggerType;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getFinishedAt() {
        return finishedAt;
    }

    public Integer getFoundCount() {
        return foundCount;
    }

    public Integer getAddedCount() {
        return addedCount;
    }

    public Integer getUpdatedCount() {
        return updatedCount;
    }

    public Integer getSkippedCount() {
        return skippedCount;
    }

    public Integer getFailedCount() {
        return failedCount;
    }

    public String getMessage() {
        return message;
    }
}
