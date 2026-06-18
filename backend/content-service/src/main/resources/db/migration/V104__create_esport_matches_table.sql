CREATE TABLE esport_matches (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    match_id NVARCHAR(100) NOT NULL CONSTRAINT uq_esport_match_id UNIQUE,
    tournament_name NVARCHAR(255) NOT NULL,
    team_a_name NVARCHAR(100) NOT NULL,
    team_b_name NVARCHAR(100) NOT NULL,
    team_a_score INT NOT NULL DEFAULT 0,
    team_b_score INT NOT NULL DEFAULT 0,
    game_name NVARCHAR(50) NOT NULL, -- CS2, VALORANT, LOL, DOTA2
    status NVARCHAR(20) NOT NULL, -- LIVE, UPCOMING, FINISHED
    match_time DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT ck_esport_status CHECK (status IN ('LIVE', 'UPCOMING', 'FINISHED')),
    CONSTRAINT ck_esport_scores CHECK (team_a_score >= 0 AND team_b_score >= 0)
);

-- GET /stats/esports?status=LIVE sıralaması: match_time ASC
CREATE INDEX ix_esport_matches_status ON esport_matches(status, match_time);
