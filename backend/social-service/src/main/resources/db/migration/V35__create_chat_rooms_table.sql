CREATE TABLE chat_rooms (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    room_name NVARCHAR(100) NULL,
    room_type VARCHAR(20) NOT NULL,
    created_by_user_id BIGINT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT chk_chat_room_type
        CHECK (room_type IN ('DIRECT', 'GROUP'))
);

CREATE TABLE chat_room_members (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    chat_room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    is_hidden BIT NOT NULL DEFAULT 0,
    hidden_at DATETIME2 NULL,
    CONSTRAINT fk_chat_room_members_room
        FOREIGN KEY (chat_room_id)
            REFERENCES chat_rooms(id)
            ON DELETE CASCADE,
    CONSTRAINT uq_chat_room_members_room_user
        UNIQUE (chat_room_id, user_id)
);

CREATE INDEX ix_chat_room_members_user_id
    ON chat_room_members(user_id);

CREATE INDEX ix_chat_room_members_chat_room_id
    ON chat_room_members(chat_room_id);

CREATE INDEX ix_chat_room_members_user_hidden
    ON chat_room_members(user_id, is_hidden);

INSERT INTO chat_room_members (chat_room_id, user_id)
SELECT id, created_by_user_id
FROM chat_rooms
WHERE NOT EXISTS (
    SELECT 1
    FROM chat_room_members existing
    WHERE existing.chat_room_id = chat_rooms.id
      AND existing.user_id = chat_rooms.created_by_user_id
);
