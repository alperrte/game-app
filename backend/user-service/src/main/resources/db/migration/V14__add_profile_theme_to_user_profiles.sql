-- ==========================================
-- V14__add_profile_theme_to_user_profiles.sql
-- ==========================================

ALTER TABLE user_profiles
ADD profile_theme_url VARCHAR(255) NULL;
