CREATE TABLE deal_price_snapshots (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    game_title NVARCHAR(255) NOT NULL,
    discounted_price DECIMAL(10, 2) NOT NULL,
    currency NVARCHAR(10) NOT NULL,
    recorded_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);

CREATE INDEX ix_price_snapshot_game_recorded ON deal_price_snapshots(game_title, recorded_at DESC);
