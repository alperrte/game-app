CREATE TABLE friendships (
                             id BIGINT IDENTITY(1,1) PRIMARY KEY,

                             user_id BIGINT NOT NULL,
                             friend_user_id BIGINT NOT NULL,

                             created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

                             CONSTRAINT chk_friendship_not_self
                                 CHECK (user_id <> friend_user_id)
);

CREATE UNIQUE INDEX uq_friendships_user_friend
    ON friendships(user_id, friend_user_id);