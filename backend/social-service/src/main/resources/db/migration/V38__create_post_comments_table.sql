CREATE TABLE post_comments (
                               id BIGINT IDENTITY(1,1) PRIMARY KEY,

                               post_id BIGINT NOT NULL,
                               user_id BIGINT NOT NULL,

                               content NVARCHAR(1000) NOT NULL,

                               is_deleted BIT NOT NULL DEFAULT 0,

                               created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                               updated_at DATETIME2 NULL,

                               CONSTRAINT fk_post_comments_post
                                   FOREIGN KEY (post_id)
                                       REFERENCES posts(id)
                                       ON DELETE CASCADE
);

CREATE INDEX ix_post_comments_post_id
    ON post_comments(post_id);

CREATE INDEX ix_post_comments_user_id
    ON post_comments(user_id);