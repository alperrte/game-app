CREATE TABLE deal_campaigns (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    game_title NVARCHAR(255) NOT NULL,
    store_name NVARCHAR(50) NOT NULL,
    deal_url NVARCHAR(500) NOT NULL CONSTRAINT uq_deal_url UNIQUE,
    image_url NVARCHAR(500) NULL,
    original_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2) NOT NULL,
    discount_percent INT NOT NULL,
    currency NVARCHAR(3) NOT NULL DEFAULT 'USD',
    steam_deck_status NVARCHAR(50) NULL, -- VERIFIED, PLAYABLE, UNSUPPORTED
    is_cross_play BIT NOT NULL DEFAULT 0,
    is_free BIT NOT NULL DEFAULT 0,
    ends_at DATETIME2 NULL,
    metacritic_score INT NULL,
    steam_rating_percent INT NULL,
    last_updated DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT ck_deal_prices CHECK (original_price >= 0 AND discounted_price >= 0),
    CONSTRAINT ck_deal_discount CHECK (discount_percent BETWEEN 0 AND 100)
);

-- Scheduler upsert: game_title + store_name benzersizliği (game_title aramalarını da kapsar)
CREATE UNIQUE INDEX uq_game_store ON deal_campaigns(game_title, store_name);

-- GET /deals sıralaması: discount_percent DESC
CREATE INDEX ix_deals_discount ON deal_campaigns(discount_percent DESC);

-- DataPruningScheduler: 7 günden eski kampanyaları silme
CREATE INDEX ix_deals_last_updated ON deal_campaigns(last_updated);

-- GET /deals/free-games
CREATE INDEX ix_deals_is_free ON deal_campaigns(is_free) WHERE is_free = 1;
