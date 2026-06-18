CREATE TABLE historical_lows (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    game_title NVARCHAR(255) NOT NULL CONSTRAINT uq_hist_title UNIQUE,
    lowest_price DECIMAL(10,2) NOT NULL,
    store_name NVARCHAR(50) NOT NULL,
    currency NVARCHAR(3) NOT NULL DEFAULT 'USD',
    recorded_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
CREATE INDEX ix_historical_title ON historical_lows(game_title);
