-- Dış kaynak (Steam/Epic/RAWG/IGDB) oyun eşleştirmeleri
CREATE TABLE external_game_ids (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    game_id BIGINT NOT NULL,
    source VARCHAR(50) NOT NULL,
    external_id NVARCHAR(100) NOT NULL,
    namespace NVARCHAR(200) NULL,
    slug NVARCHAR(200) NULL,

    last_synced_at DATETIME2 NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT fk_external_game_ids_game
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    CONSTRAINT uq_external_game_ids_source_external
        UNIQUE (source, external_id)
);
