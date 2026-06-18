CREATE TABLE user_trivia_answers (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    trivia_date DATE NOT NULL,
    is_correct BIT NOT NULL,
    answered_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_user_daily_trivia UNIQUE (user_id, trivia_date)
);

CREATE INDEX ix_user_trivia_date ON user_trivia_answers(user_id, trivia_date);
