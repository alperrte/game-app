CREATE TABLE user_profile_reviews (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    reviewer_id VARCHAR(50) NOT NULL,
    reviewer_username VARCHAR(100) NOT NULL,
    reviewer_display_name VARCHAR(150) NULL,
    reviewer_avatar_url VARCHAR(255) NULL,
    reviewed_id VARCHAR(50) NOT NULL,
    content NVARCHAR(1000) NOT NULL,
    friendly_point BIT NOT NULL DEFAULT 0,
    leader_point BIT NOT NULL DEFAULT 0,
    aim_god_point BIT NOT NULL DEFAULT 0,
    tactician_point BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_user_profile_reviews_reviewed_id ON user_profile_reviews(reviewed_id, created_at DESC);
CREATE INDEX idx_user_profile_reviews_reviewer_id ON user_profile_reviews(reviewer_id);
