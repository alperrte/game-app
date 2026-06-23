CREATE TABLE media_assets (
                              id BIGINT IDENTITY(1,1) PRIMARY KEY,

                              owner_user_id BIGINT NOT NULL,
                              post_id BIGINT NULL,
                              community_id BIGINT NULL,
                              community_event_id BIGINT NULL,
                              message_id BIGINT NULL,
                              chat_room_id BIGINT NULL,

                              media_type VARCHAR(20) NOT NULL,
                              status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

                              url NVARCHAR(500) NOT NULL,
                              file_name NVARCHAR(255) NOT NULL,
                              content_type NVARCHAR(100) NOT NULL,
                              size_bytes BIGINT NOT NULL,

                              created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                              attached_at DATETIME2 NULL,
                              deleted_at DATETIME2 NULL,

                              CONSTRAINT chk_media_asset_type
                                  CHECK (media_type IN ('IMAGE', 'VIDEO', 'FILE')),

                              CONSTRAINT chk_media_asset_status
                                  CHECK (status IN ('PENDING', 'ATTACHED', 'DELETED')),

                              CONSTRAINT chk_media_asset_single_attachment
                                  CHECK (
                                      (CASE WHEN post_id IS NULL THEN 0 ELSE 1 END)
                                      + (CASE WHEN community_id IS NULL THEN 0 ELSE 1 END)
                                      + (CASE WHEN community_event_id IS NULL THEN 0 ELSE 1 END)
                                      + (CASE WHEN message_id IS NULL THEN 0 ELSE 1 END)
                                      + (CASE WHEN chat_room_id IS NULL THEN 0 ELSE 1 END)
                                      <= 1
                                  ),

                              CONSTRAINT fk_media_assets_post
                                  FOREIGN KEY (post_id)
                                      REFERENCES posts(id)
                                      ON DELETE SET NULL,

                              CONSTRAINT fk_media_assets_community
                                  FOREIGN KEY (community_id)
                                      REFERENCES communities(id)
                                      ON DELETE NO ACTION,

                              CONSTRAINT fk_media_assets_community_event
                                  FOREIGN KEY (community_event_id)
                                      REFERENCES community_events(id)
                                      ON DELETE NO ACTION,

                              CONSTRAINT fk_media_assets_message
                                  FOREIGN KEY (message_id)
                                      REFERENCES messages(id)
                                      ON DELETE NO ACTION,

                              CONSTRAINT fk_media_assets_chat_room
                                  FOREIGN KEY (chat_room_id)
                                      REFERENCES chat_rooms(id)
                                      ON DELETE NO ACTION
);

CREATE UNIQUE INDEX uq_media_assets_url
    ON media_assets(url);

CREATE INDEX ix_media_assets_owner_status
    ON media_assets(owner_user_id, status);

CREATE INDEX ix_media_assets_status_created_at
    ON media_assets(status, created_at);

CREATE INDEX ix_media_assets_post_id
    ON media_assets(post_id);

CREATE INDEX ix_media_assets_community_id
    ON media_assets(community_id);

CREATE INDEX ix_media_assets_community_event_id
    ON media_assets(community_event_id);

CREATE INDEX ix_media_assets_message_id
    ON media_assets(message_id);

CREATE INDEX ix_media_assets_chat_room_id
    ON media_assets(chat_room_id);
