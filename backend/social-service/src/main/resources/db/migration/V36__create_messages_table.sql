CREATE TABLE messages (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    chat_room_id BIGINT NOT NULL,
    sender_user_id BIGINT NOT NULL,
    content NVARCHAR(1000) NOT NULL,
    is_read BIT NOT NULL DEFAULT 0,
    read_at DATETIME2 NULL,
    is_deleted BIT NOT NULL DEFAULT 0,
    reply_to_message_id BIGINT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2 NULL,
    CONSTRAINT fk_messages_chat_room
        FOREIGN KEY (chat_room_id)
            REFERENCES chat_rooms(id)
            ON DELETE CASCADE,
    CONSTRAINT fk_messages_reply_to
        FOREIGN KEY (reply_to_message_id)
            REFERENCES messages(id)
            ON DELETE NO ACTION
);

CREATE INDEX ix_messages_chat_room_id
    ON messages(chat_room_id);

CREATE INDEX ix_messages_sender_user_id
    ON messages(sender_user_id);

CREATE INDEX ix_messages_reply_to_message_id
    ON messages(reply_to_message_id);

CREATE TABLE message_reactions (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    message_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    emoji NVARCHAR(16) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT fk_message_reactions_message
        FOREIGN KEY (message_id)
            REFERENCES messages(id)
            ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_message_reactions_message_user
    ON message_reactions(message_id, user_id);

CREATE INDEX ix_message_reactions_message_id
    ON message_reactions(message_id);
