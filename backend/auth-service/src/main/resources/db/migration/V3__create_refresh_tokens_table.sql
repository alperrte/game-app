-- LobbyTwoZero Auth Service - Refresh Tokens Table
CREATE TABLE refresh_tokens (
                                id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                user_id BIGINT NOT NULL,

                                token NVARCHAR(500) NOT NULL UNIQUE,

                                revoked BIT NOT NULL DEFAULT 0,

                                expires_at DATETIME2 NOT NULL,

                                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

                                CONSTRAINT fk_refresh_tokens_user
                                    FOREIGN KEY (user_id)
                                        REFERENCES user_credentials(id)
                                        ON DELETE CASCADE
);