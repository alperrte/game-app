CREATE TABLE user_trivia_answers (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    trivia_date DATE NOT NULL,
    is_correct BIT NOT NULL,
    answered_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_user_daily_trivia UNIQUE (user_id, trivia_date)
);

-- uq_user_daily_trivia zaten (user_id, trivia_date) lookup'ını kapsar
