-- ==========================================
-- V11__create_user_profiles_table.sql
-- ==========================================

CREATE TABLE user_profiles (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    bio NVARCHAR(1000),
    avatar_url VARCHAR(255),
    cover_url VARCHAR(255),
    gamer_type VARCHAR(50),
    favorite_categories VARCHAR(255),
    profile_theme_url VARCHAR(255) NULL,
    profile_background_url VARCHAR(255) NULL,
    profile_music_url VARCHAR(255) NULL,
    hardware_cpu VARCHAR(100) NULL,
    hardware_gpu VARCHAR(100) NULL,
    hardware_ram VARCHAR(100) NULL,
    hardware_os VARCHAR(100) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

