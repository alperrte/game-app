CREATE TABLE game_categories (
                                 id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                 name NVARCHAR(100) NOT NULL UNIQUE,
                                 description NVARCHAR(500) NULL,

                                 created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                 updated_at DATETIME2 NULL
);

CREATE TABLE game_platforms (
                                id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                name NVARCHAR(100) NOT NULL UNIQUE,
                                description NVARCHAR(500) NULL,

                                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                updated_at DATETIME2 NULL
);