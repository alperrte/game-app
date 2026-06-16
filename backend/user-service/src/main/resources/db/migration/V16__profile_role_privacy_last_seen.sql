ALTER TABLE user_profiles ADD role VARCHAR(50) NOT NULL DEFAULT 'USER';
ALTER TABLE user_profiles ADD last_seen_at DATETIME2 NULL;

ALTER TABLE privacy_settings ADD follower_list_visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC';
ALTER TABLE privacy_settings ADD last_seen_visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC';
