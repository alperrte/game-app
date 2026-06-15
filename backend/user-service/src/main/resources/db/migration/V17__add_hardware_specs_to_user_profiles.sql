-- ==========================================
-- V17__add_hardware_specs_to_user_profiles.sql
-- ==========================================

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('user_profiles')
    AND name = 'hardware_cpu'
)
BEGIN
    ALTER TABLE user_profiles ADD hardware_cpu VARCHAR(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('user_profiles')
    AND name = 'hardware_gpu'
)
BEGIN
    ALTER TABLE user_profiles ADD hardware_gpu VARCHAR(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('user_profiles')
    AND name = 'hardware_ram'
)
BEGIN
    ALTER TABLE user_profiles ADD hardware_ram VARCHAR(100) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('user_profiles')
    AND name = 'hardware_os'
)
BEGIN
    ALTER TABLE user_profiles ADD hardware_os VARCHAR(100) NULL;
END;
