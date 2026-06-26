CREATE TABLE post_polls (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    post_id BIGINT NOT NULL,
    question NVARCHAR(160) NOT NULL,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_post_polls_post UNIQUE (post_id),
    CONSTRAINT fk_post_polls_post FOREIGN KEY (post_id)
        REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE post_poll_options (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    poll_id BIGINT NOT NULL,
    option_text NVARCHAR(120) NOT NULL,
    display_order INT NOT NULL,
    CONSTRAINT uq_post_poll_options_order UNIQUE (poll_id, display_order),
    CONSTRAINT fk_post_poll_options_poll FOREIGN KEY (poll_id)
        REFERENCES post_polls(id) ON DELETE CASCADE
);

CREATE INDEX ix_post_poll_options_poll ON post_poll_options(poll_id);

CREATE TABLE post_poll_votes (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    poll_id BIGINT NOT NULL,
    option_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_post_poll_votes_user UNIQUE (poll_id, user_id),
    CONSTRAINT fk_post_poll_votes_poll FOREIGN KEY (poll_id)
        REFERENCES post_polls(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_poll_votes_option FOREIGN KEY (option_id)
        REFERENCES post_poll_options(id) ON DELETE NO ACTION
);

CREATE INDEX ix_post_poll_votes_option ON post_poll_votes(option_id);
