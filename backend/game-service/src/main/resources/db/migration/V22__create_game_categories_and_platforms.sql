CREATE TABLE game_categories (
                                 id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                 name NVARCHAR(100) NOT NULL,
                                 description NVARCHAR(500) NULL,
                                 source VARCHAR(50) NULL,

                                 created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                 updated_at DATETIME2 NULL
);

CREATE UNIQUE INDEX uq_game_categories_source_name
    ON game_categories(source, name)
    WHERE source IS NOT NULL;

CREATE TABLE game_platforms (
                                id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                name NVARCHAR(100) NOT NULL UNIQUE,
                                description NVARCHAR(500) NULL,

                                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                updated_at DATETIME2 NULL
);