CREATE TABLE games (
                       id BIGINT IDENTITY(1,1) PRIMARY KEY,

                       title NVARCHAR(150) NOT NULL,
                       description NVARCHAR(3000) NULL,
                       genre NVARCHAR(100) NULL,
                       platform NVARCHAR(100) NULL,

                       release_date DATE NULL,

                       developer NVARCHAR(150) NULL,
                       publisher NVARCHAR(150) NULL,

                       minimum_system_requirements NVARCHAR(2000) NULL,
                       recommended_system_requirements NVARCHAR(2000) NULL,

                       supported_languages NVARCHAR(500) NULL,
                       cover_image_url NVARCHAR(500) NULL,

                       early_access BIT NOT NULL DEFAULT 0,
                       on_sale BIT NOT NULL DEFAULT 0,
                       turkish_language_support BIT NOT NULL DEFAULT 0,

                       created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                       updated_at DATETIME2 NULL
);