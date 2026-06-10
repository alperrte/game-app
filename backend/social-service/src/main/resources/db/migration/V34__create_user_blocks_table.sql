CREATE TABLE user_blocks (
                             id BIGINT IDENTITY(1,1) PRIMARY KEY,

                             blocker_user_id BIGINT NOT NULL,
                             blocked_user_id BIGINT NOT NULL,

                             created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

                             CONSTRAINT chk_user_block_not_self
                                 CHECK (blocker_user_id <> blocked_user_id)
);

CREATE UNIQUE INDEX uq_user_blocks_blocker_blocked
    ON user_blocks(blocker_user_id, blocked_user_id);