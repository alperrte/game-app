CREATE TABLE daily_trivias (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    question NVARCHAR(500) NOT NULL,
    options_json NVARCHAR(1000) NOT NULL,
    correct_option_index INT NOT NULL,
    trivia_date DATE NOT NULL CONSTRAINT uq_trivia_date UNIQUE,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
