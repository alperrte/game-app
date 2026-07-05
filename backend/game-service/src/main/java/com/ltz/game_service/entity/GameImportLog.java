package com.ltz.game_service.entity;

import com.ltz.game_service.entity.enums.ImportLogLevel;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "game_import_logs")
public class GameImportLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false, length = 10)
    private ImportLogLevel level;

    @Column(name = "external_id", length = 100)
    private String externalId;

    @Column(name = "message", length = 2000)
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public GameImportLog() {
    }

    public GameImportLog(Long jobId, ImportLogLevel level, String externalId, String message) {
        this.jobId = jobId;
        this.level = level;
        this.externalId = externalId;
        this.message = message;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getJobId() {
        return jobId;
    }

    public void setJobId(Long jobId) {
        this.jobId = jobId;
    }

    public ImportLogLevel getLevel() {
        return level;
    }

    public void setLevel(ImportLogLevel level) {
        this.level = level;
    }

    public String getExternalId() {
        return externalId;
    }

    public void setExternalId(String externalId) {
        this.externalId = externalId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
