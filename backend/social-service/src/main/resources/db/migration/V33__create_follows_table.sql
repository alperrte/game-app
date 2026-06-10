CREATE TABLE follows (
                         id BIGINT IDENTITY(1,1) PRIMARY KEY,

                         follower_user_id BIGINT NOT NULL,
                         following_user_id BIGINT NOT NULL,

                         created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

                         CONSTRAINT chk_follow_not_self
                             CHECK (follower_user_id <> following_user_id)
);

CREATE UNIQUE INDEX uq_follows_follower_following
    ON follows(follower_user_id, following_user_id);