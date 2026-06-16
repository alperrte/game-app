CREATE TABLE developers (
                            id BIGINT IDENTITY(1,1) PRIMARY KEY,

                            name NVARCHAR(150) NOT NULL UNIQUE,
                            description NVARCHAR(1000) NULL,
                            website_url NVARCHAR(500) NULL,
                            country NVARCHAR(100) NULL,

                            created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                            updated_at DATETIME2 NULL
);

CREATE TABLE publishers (
                            id BIGINT IDENTITY(1,1) PRIMARY KEY,

                            name NVARCHAR(150) NOT NULL UNIQUE,
                            description NVARCHAR(1000) NULL,
                            website_url NVARCHAR(500) NULL,
                            country NVARCHAR(100) NULL,

                            created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                            updated_at DATETIME2 NULL
);