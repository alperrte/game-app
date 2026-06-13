CREATE TABLE looking_for_player_posts (
                                          id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                          user_id BIGINT NOT NULL,
                                          game_id BIGINT NOT NULL,

                                          title NVARCHAR(150) NOT NULL,
                                          description NVARCHAR(1000) NULL,

                                          platform NVARCHAR(50) NOT NULL,
                                          preferred_role NVARCHAR(100) NULL,
                                          player_level NVARCHAR(50) NULL,

                                          microphone_required BIT NOT NULL DEFAULT 0,

                                          play_time DATETIME2 NULL,

                                          status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

                                          created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                                          updated_at DATETIME2 NULL,

                                          CONSTRAINT chk_lfp_status
                                              CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED'))
);

CREATE INDEX ix_lfp_user_id
    ON looking_for_player_posts(user_id);

CREATE INDEX ix_lfp_game_id
    ON looking_for_player_posts(game_id);