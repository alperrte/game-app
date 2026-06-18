CREATE TABLE content_reactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    content_id BIGINT NOT NULL, -- haber veya kampanya ID'si
    content_type NVARCHAR(20) NOT NULL, -- 'NEWS', 'CAMPAIGN'
    user_id BIGINT NOT NULL,
    reaction_type NVARCHAR(20) NOT NULL, -- 'HYPE', 'WORTH_IT', 'MEH', 'TRASH'
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_user_content_reaction UNIQUE (user_id, content_id, content_type)
);
CREATE INDEX ix_content_reaction ON content_reactions(content_id, content_type);
