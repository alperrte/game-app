CREATE TABLE gaming_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    event_day INT NOT NULL, -- 1 ile 31 arası
    event_month INT NOT NULL, -- 1 ile 12 arası
    event_year INT NOT NULL, -- örn. 1996
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000) NOT NULL,
    image_url NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_event_date_title UNIQUE (event_day, event_month, event_year, title)
);
CREATE INDEX ix_gaming_history_date ON gaming_history(event_month, event_day);
