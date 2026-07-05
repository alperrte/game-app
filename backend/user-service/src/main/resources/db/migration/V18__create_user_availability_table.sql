CREATE TABLE user_availability (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT uk_user_availability_slot UNIQUE (user_id, day_of_week, time_slot)
);

CREATE INDEX idx_user_availability_match ON user_availability(day_of_week, time_slot);
CREATE INDEX idx_user_availability_user ON user_availability(user_id);
