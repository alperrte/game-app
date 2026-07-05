-- Import sırasında oluşan log/hata/uyarı kayıtları
CREATE TABLE game_import_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    job_id BIGINT NOT NULL,
    level VARCHAR(10) NOT NULL,
    external_id NVARCHAR(100) NULL,
    message NVARCHAR(2000) NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

    CONSTRAINT fk_import_logs_job
        FOREIGN KEY (job_id) REFERENCES game_import_jobs(id) ON DELETE CASCADE
);
