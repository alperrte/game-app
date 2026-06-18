CREATE TABLE spotlight_banners (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    subtitle NVARCHAR(500) NULL,
    image_url NVARCHAR(500) NOT NULL,
    target_url NVARCHAR(500) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
