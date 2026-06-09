CREATE TABLE post_likes (
                            id BIGINT IDENTITY(1,1) PRIMARY KEY,

                            post_id BIGINT NOT NULL,
                            user_id BIGINT NOT NULL,

                            created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

                            CONSTRAINT fk_post_likes_post
                                FOREIGN KEY (post_id)
                                    REFERENCES posts(id)
                                    ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_post_likes_post_user
    ON post_likes(post_id, user_id);

CREATE INDEX ix_post_likes_user_id
    ON post_likes(user_id);