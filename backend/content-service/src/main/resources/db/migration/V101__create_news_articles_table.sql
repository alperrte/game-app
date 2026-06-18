CREATE TABLE news_articles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    summary NVARCHAR(1000) NULL,
    content_url NVARCHAR(500) NOT NULL CONSTRAINT uq_news_content_url UNIQUE,
    image_url NVARCHAR(500) NULL,
    source_name NVARCHAR(100) NOT NULL,
    category NVARCHAR(50) NOT NULL, -- GLOBAL, HARDWARE, PATCH_NOTES
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT ck_news_category CHECK (category IN ('GLOBAL', 'HARDWARE', 'PATCH_NOTES'))
);

-- Kategori filtreli listeleme + tarih sıralaması
CREATE INDEX ix_news_category_created ON news_articles(category, created_at DESC);

-- Genel listeleme (created_at DESC) ve 30 günlük pruning job
CREATE INDEX ix_news_created_at ON news_articles(created_at);
