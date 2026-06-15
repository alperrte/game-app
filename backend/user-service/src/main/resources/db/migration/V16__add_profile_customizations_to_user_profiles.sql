-- ==========================================
-- V16__add_profile_customizations_to_user_profiles.sql
-- ==========================================

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('user_profiles') 
    AND name = 'profile_background_url'
)
BEGIN
    ALTER TABLE user_profiles ADD profile_background_url VARCHAR(255) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('user_profiles') 
    AND name = 'profile_music_url'
)
BEGIN
    ALTER TABLE user_profiles ADD profile_music_url VARCHAR(255) NULL;
END;
