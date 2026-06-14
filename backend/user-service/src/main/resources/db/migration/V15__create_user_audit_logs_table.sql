-- ==========================================
-- V15__create_user_audit_logs_table.sql
-- ==========================================
CREATE TABLE user_audit_logs (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details NVARCHAR(1000) NULL,
    ip_address VARCHAR(45) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX ix_user_audit_logs_user_id ON user_audit_logs(user_id);
