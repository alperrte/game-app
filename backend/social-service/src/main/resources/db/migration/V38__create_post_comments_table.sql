CREATE TABLE post_comments (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    post_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content NVARCHAR(1000) NOT NULL,
    parent_comment_id BIGINT NULL,
    replying_to_user_id BIGINT NULL,
    is_deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_post_comments_post
        FOREIGN KEY (post_id)
            REFERENCES posts(id)
            ON DELETE CASCADE,
    CONSTRAINT fk_post_comments_parent
        FOREIGN KEY (parent_comment_id)
            REFERENCES post_comments(id)
            ON DELETE NO ACTION
);

CREATE INDEX ix_post_comments_post_id
    ON post_comments(post_id);

CREATE INDEX ix_post_comments_user_id
    ON post_comments(user_id);

CREATE INDEX ix_post_comments_parent_comment_id
    ON post_comments(parent_comment_id);

CREATE INDEX ix_post_comments_replying_to_user_id
    ON post_comments(replying_to_user_id);

CREATE TABLE post_comment_likes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_post_comment_likes_comment
        FOREIGN KEY (comment_id)
            REFERENCES post_comments(id)
            ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_post_comment_likes_comment_user
    ON post_comment_likes(comment_id, user_id);

CREATE INDEX ix_post_comment_likes_user_id
    ON post_comment_likes(user_id);
