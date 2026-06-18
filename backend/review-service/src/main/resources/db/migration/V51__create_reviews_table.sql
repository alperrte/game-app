CREATE TABLE reviews (
                         id BIGINT IDENTITY(1,1) PRIMARY KEY,

                         game_id BIGINT NOT NULL,
                         user_id BIGINT NOT NULL,

                         rating INT NOT NULL,
                         review_text NVARCHAR(3000) NOT NULL,
                         recommended BIT NOT NULL,

                         playtime_hours INT NULL,
                         platform NVARCHAR(100) NULL,
                         hardware_info NVARCHAR(500) NULL,

                         like_count INT NOT NULL DEFAULT 0,
                         report_count INT NOT NULL DEFAULT 0,

                         created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                         updated_at DATETIME2 NULL,

                         CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 10),
                         CONSTRAINT chk_reviews_playtime_hours CHECK (playtime_hours IS NULL OR playtime_hours >= 0),
                         CONSTRAINT uq_reviews_game_user UNIQUE (game_id, user_id)
);