

CREATE TABLE connected_accounts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    platform_name VARCHAR(50) NOT NULL,
    platform_user_id VARCHAR(100) NOT NULL,
    platform_username VARCHAR(100),
    connected_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_user_platform UNIQUE (user_id, platform_name)
);