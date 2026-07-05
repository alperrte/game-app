-- Artımlı (progressive) import için kaynak app senkron durumu
-- Hangi appid işlendi, ne zaman, sonucu ne (IMPORTED/SKIPPED/FAILED) bilgisini tutar.
CREATE TABLE game_import_sync_state (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    source VARCHAR(50) NOT NULL,
    external_id NVARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    app_type NVARCHAR(50) NULL,
    attempts INT NOT NULL DEFAULT 0,

    last_attempt_at DATETIME2 NULL,
    last_synced_at DATETIME2 NULL,
    message NVARCHAR(1000) NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT uq_sync_state_source_external
        UNIQUE (source, external_id)
);
