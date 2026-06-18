CREATE TABLE user_assigned_badges (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    badge_key VARCHAR(50) NOT NULL,
    label VARCHAR(100) NOT NULL,
    assigned_by VARCHAR(50) NOT NULL,
    assigned_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT uk_user_assigned_badge UNIQUE (user_id, badge_key)
);

CREATE INDEX idx_user_assigned_badges_user_id ON user_assigned_badges(user_id);
