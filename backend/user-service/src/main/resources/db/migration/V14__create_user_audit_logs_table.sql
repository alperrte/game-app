CREATE TABLE user_audit_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_agent NVARCHAR(512) NULL,
    device_info NVARCHAR(255) NULL,
    action VARCHAR(100) NOT NULL,
    details NVARCHAR(1000) NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_user_audit_logs_user_id_created_at ON user_audit_logs(user_id, created_at DESC);