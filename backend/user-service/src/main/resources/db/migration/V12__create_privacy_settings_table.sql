-- ==========================================
-- V12__create_privacy_settings_table.sql
-- ==========================================

CREATE TABLE privacy_settings (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    profile_visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    game_library_visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    hardware_visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    friend_list_visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    follower_list_visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    last_seen_visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC'
);