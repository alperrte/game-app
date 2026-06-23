CREATE TABLE communities (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    owner_user_id BIGINT NOT NULL,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(1000) NOT NULL,
    category NVARCHAR(80) NULL,
    image_url NVARCHAR(500) NULL,
    members_visible BIT NOT NULL DEFAULT 1,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT chk_community_visibility CHECK (visibility IN ('PUBLIC', 'PRIVATE'))
);

CREATE UNIQUE INDEX uq_communities_name ON communities(name);
CREATE INDEX ix_communities_owner ON communities(owner_user_id);

CREATE TABLE community_members (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    community_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    member_role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_community_member UNIQUE (community_id, user_id),
    CONSTRAINT chk_community_member_role CHECK (member_role IN ('OWNER', 'MEMBER')),
    CONSTRAINT fk_community_members_community FOREIGN KEY (community_id)
        REFERENCES communities(id) ON DELETE CASCADE
);

CREATE INDEX ix_community_members_user ON community_members(user_id);

CREATE TABLE community_invitations (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    community_id BIGINT NOT NULL,
    inviter_user_id BIGINT NOT NULL,
    invited_user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    responded_at DATETIME2 NULL,
    CONSTRAINT uq_community_invitation UNIQUE (community_id, invited_user_id),
    CONSTRAINT chk_community_invitation_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    CONSTRAINT fk_community_invitations_community FOREIGN KEY (community_id)
        REFERENCES communities(id) ON DELETE CASCADE
);

CREATE INDEX ix_community_invitations_invited_status
    ON community_invitations(invited_user_id, status);

CREATE TABLE community_events (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    community_id BIGINT NOT NULL,
    organizer_user_id BIGINT NOT NULL,
    title NVARCHAR(150) NOT NULL,
    description NVARCHAR(1500) NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING',
    location NVARCHAR(255) NULL,
    image_url NVARCHAR(500) NULL,
    starts_at DATETIME2 NOT NULL,
    ends_at DATETIME2 NULL,
    capacity INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT chk_community_event_type
        CHECK (event_type IN ('GAME_NIGHT', 'TOURNAMENT', 'MEETUP')),
    CONSTRAINT chk_community_event_status
        CHECK (status IN ('UPCOMING', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_community_event_capacity
        CHECK (capacity IS NULL OR capacity > 0),
    CONSTRAINT fk_community_events_community FOREIGN KEY (community_id)
        REFERENCES communities(id) ON DELETE CASCADE
);

CREATE INDEX ix_community_events_start ON community_events(status, starts_at);
CREATE INDEX ix_community_events_community ON community_events(community_id);

CREATE TABLE community_event_participants (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT uq_community_event_participant UNIQUE (event_id, user_id),
    CONSTRAINT fk_event_participants_event FOREIGN KEY (event_id)
        REFERENCES community_events(id) ON DELETE CASCADE
);

CREATE INDEX ix_event_participants_user ON community_event_participants(user_id);

CREATE TABLE posts (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    community_id BIGINT NULL,
    content NVARCHAR(2000) NOT NULL,
    image_url NVARCHAR(500) NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    is_deleted BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT chk_post_visibility
        CHECK (visibility IN ('PUBLIC', 'FRIENDS', 'PRIVATE')),
    CONSTRAINT fk_posts_community FOREIGN KEY (community_id)
        REFERENCES communities(id) ON DELETE NO ACTION
);

CREATE INDEX ix_posts_user_id ON posts(user_id);
CREATE INDEX ix_posts_community_created_at ON posts(community_id, created_at DESC);
