-- Dış kaynaklardan gelen review özetleri (LTZ kullanıcı incelemeleri review-service'te kalır)
CREATE TABLE game_review_summaries (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    game_id BIGINT NOT NULL,
    source VARCHAR(50) NOT NULL,

    review_score INT NULL,
    review_score_desc NVARCHAR(100) NULL,
    total_reviews INT NULL,
    total_positive INT NULL,
    total_negative INT NULL,

    last_synced_at DATETIME2 NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT fk_review_summary_game
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    CONSTRAINT uq_review_summary_game_source
        UNIQUE (game_id, source)
);
