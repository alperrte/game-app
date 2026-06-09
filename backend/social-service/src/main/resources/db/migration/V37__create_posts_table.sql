CREATE TABLE posts (
                       id BIGINT IDENTITY(1,1) PRIMARY KEY,

                       user_id BIGINT NOT NULL,

                       content NVARCHAR(2000) NOT NULL,
                       image_url NVARCHAR(500) NULL,

                       visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',

                       is_deleted BIT NOT NULL DEFAULT 0,

                       created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                       updated_at DATETIME2 NULL,

                       CONSTRAINT chk_post_visibility
                           CHECK (visibility IN ('PUBLIC', 'FRIENDS', 'PRIVATE'))
);

CREATE INDEX ix_posts_user_id
    ON posts(user_id);