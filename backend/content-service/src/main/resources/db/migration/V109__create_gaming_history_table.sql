CREATE TABLE gaming_history (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    event_day INT NOT NULL,
    event_month INT NOT NULL,
    event_year INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(1000) NOT NULL,
    image_url NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_event_date_title UNIQUE (event_day, event_month, event_year, title),
    CONSTRAINT ck_history_day CHECK (event_day BETWEEN 1 AND 31),
    CONSTRAINT ck_history_month CHECK (event_month BETWEEN 1 AND 12),
    CONSTRAINT ck_history_year CHECK (event_year BETWEEN 1970 AND 2100)
);

CREATE INDEX ix_gaming_history_date ON gaming_history(event_month, event_day);
