CREATE TABLE messages (
                          id BIGINT IDENTITY(1,1) PRIMARY KEY,

                          chat_room_id BIGINT NOT NULL,
                          sender_user_id BIGINT NOT NULL,

                          content NVARCHAR(1000) NOT NULL,

                          is_read BIT NOT NULL DEFAULT 0,
                          is_deleted BIT NOT NULL DEFAULT 0,

                          created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                          updated_at DATETIME2 NULL,

                          CONSTRAINT fk_messages_chat_room
                              FOREIGN KEY (chat_room_id)
                                  REFERENCES chat_rooms(id)
                                  ON DELETE CASCADE
);

CREATE INDEX ix_messages_chat_room_id
    ON messages(chat_room_id);

CREATE INDEX ix_messages_sender_user_id
    ON messages(sender_user_id);