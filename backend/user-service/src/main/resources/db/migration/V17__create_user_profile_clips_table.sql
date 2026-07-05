CREATE TABLE user_profile_clips (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title NVARCHAR(100) NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX idx_user_clips_user_id ON user_profile_clips(user_id);
