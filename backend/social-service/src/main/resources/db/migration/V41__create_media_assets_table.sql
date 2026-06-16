CREATE TABLE media_assets (
                              id BIGINT IDENTITY(1,1) PRIMARY KEY,

                              owner_user_id BIGINT NOT NULL,
                              post_id BIGINT NULL,

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
                                  CHECK (media_type IN ('IMAGE', 'VIDEO')),

                              CONSTRAINT chk_media_asset_status
                                  CHECK (status IN ('PENDING', 'ATTACHED', 'DELETED')),

                              CONSTRAINT fk_media_assets_post
                                  FOREIGN KEY (post_id)
                                      REFERENCES posts(id)
                                      ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_media_assets_url
    ON media_assets(url);

CREATE INDEX ix_media_assets_owner_status
    ON media_assets(owner_user_id, status);

CREATE INDEX ix_media_assets_status_created_at
    ON media_assets(status, created_at);

CREATE INDEX ix_media_assets_post_id
    ON media_assets(post_id);
