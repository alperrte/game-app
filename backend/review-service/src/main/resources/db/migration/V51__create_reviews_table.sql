CREATE TABLE reviews (
                         id BIGINT IDENTITY(1,1) PRIMARY KEY,

                         game_source NVARCHAR(30) NOT NULL DEFAULT 'INTERNAL',
                         game_id BIGINT NULL,
                         external_game_id NVARCHAR(100) NULL,
                         user_id BIGINT NOT NULL,

                         rating INT NOT NULL,
                         review_text NVARCHAR(3000) NOT NULL,

                         graphics_review NVARCHAR(1500) NULL,
                         gameplay_review NVARCHAR(1500) NULL,
                         story_review NVARCHAR(1500) NULL,
                         performance_review NVARCHAR(1500) NULL,
                         pros NVARCHAR(1500) NULL,
                         cons NVARCHAR(1500) NULL,

                         recommended BIT NOT NULL,

                         playtime_hours INT NULL,
                         playtime_minutes INT NULL,
                         platform NVARCHAR(100) NULL,
                         hardware_info NVARCHAR(500) NULL,

                         like_count INT NOT NULL DEFAULT 0,
                         report_count INT NOT NULL DEFAULT 0,

                         created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                         updated_at DATETIME2 NULL,

                         CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 10),
                         CONSTRAINT chk_reviews_playtime_hours CHECK (playtime_hours IS NULL OR playtime_hours >= 0),
                         CONSTRAINT chk_reviews_playtime_minutes CHECK (playtime_minutes IS NULL OR playtime_minutes BETWEEN 0 AND 59),

                         CONSTRAINT chk_reviews_game_reference CHECK (
                             (
                                 game_source = 'INTERNAL'
                                     AND game_id IS NOT NULL
                                     AND external_game_id IS NULL
                                 )
                                 OR
                             (
                                 game_source IN ('STEAM', 'EPIC')
                                     AND game_id IS NULL
                                     AND external_game_id IS NOT NULL
                                 )
                             )
);

CREATE UNIQUE INDEX uq_reviews_internal_game_user
    ON reviews (game_source, game_id, user_id)
    WHERE game_source = 'INTERNAL' AND game_id IS NOT NULL;

CREATE UNIQUE INDEX uq_reviews_external_game_user
    ON reviews (game_source, external_game_id, user_id)
    WHERE game_source IN ('STEAM', 'EPIC') AND external_game_id IS NOT NULL;