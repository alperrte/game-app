-- Mağaza durumu, fiyat ve indirim bilgisi (kaynak bazlı)
CREATE TABLE game_store_availability (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    game_id BIGINT NOT NULL,
    source VARCHAR(50) NOT NULL,

    store_status VARCHAR(50) NULL,
    is_free BIT NOT NULL DEFAULT 0,
    price_final INT NULL,
    price_initial INT NULL,
    currency VARCHAR(10) NULL,
    discount_percent INT NULL,
    region VARCHAR(10) NULL,
    store_url NVARCHAR(500) NULL,

    last_checked_at DATETIME2 NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NULL,

    CONSTRAINT fk_store_availability_game
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    CONSTRAINT uq_store_availability_game_source
        UNIQUE (game_id, source)
);
