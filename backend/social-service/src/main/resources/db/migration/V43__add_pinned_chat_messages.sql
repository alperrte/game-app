ALTER TABLE chat_rooms
    ADD pinned_message_id BIGINT NULL;

ALTER TABLE chat_rooms
    ADD CONSTRAINT fk_chat_rooms_pinned_message
        FOREIGN KEY (pinned_message_id)
            REFERENCES messages(id)
            ON DELETE NO ACTION;

CREATE INDEX ix_chat_rooms_pinned_message_id
    ON chat_rooms(pinned_message_id);
