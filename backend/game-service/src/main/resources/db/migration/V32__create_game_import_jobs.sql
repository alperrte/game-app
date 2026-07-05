-- Import job çalışma kayıtları
CREATE TABLE game_import_jobs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    source VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    trigger_type VARCHAR(20) NULL,

    started_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    finished_at DATETIME2 NULL,

    found_count INT NOT NULL DEFAULT 0,
    added_count INT NOT NULL DEFAULT 0,
    updated_count INT NOT NULL DEFAULT 0,
    skipped_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,

    message NVARCHAR(1000) NULL
);
