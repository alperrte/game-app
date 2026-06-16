IF COL_LENGTH('game_platforms', 'logo_url') IS NULL
BEGIN
ALTER TABLE game_platforms
    ADD logo_url NVARCHAR(500) NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM game_platforms
    WHERE LOWER(name) = 'steam'
)
BEGIN
EXEC('
        INSERT INTO game_platforms (
            name,
            description,
            logo_url,
            created_at,
            updated_at
        )
        VALUES (
            ''Steam'',
            ''Valve tarafından geliştirilen dijital oyun dağıtım platformu.'',
            ''https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg'',
            SYSUTCDATETIME(),
            NULL
        )
    ');
END;

EXEC('
    UPDATE game_platforms
    SET
        logo_url = ''https://upload.wikimedia.org/wikipedia/commons/8/83/Steam_icon_logo.svg'',
        updated_at = SYSUTCDATETIME()
    WHERE LOWER(name) = ''steam''
      AND (logo_url IS NULL OR LTRIM(RTRIM(logo_url)) = '''')
');

IF NOT EXISTS (
    SELECT 1 FROM game_platforms
    WHERE LOWER(name) IN ('epic games', 'epic games store')
)
BEGIN
EXEC('
        INSERT INTO game_platforms (
            name,
            description,
            logo_url,
            created_at,
            updated_at
        )
        VALUES (
            ''Epic Games Store'',
            ''Epic Games tarafından geliştirilen dijital oyun mağazası.'',
            ''https://upload.wikimedia.org/wikipedia/commons/3/31/Epic_Games_logo.svg'',
            SYSUTCDATETIME(),
            NULL
        )
    ');
END;

EXEC('
    UPDATE game_platforms
    SET
        logo_url = ''https://upload.wikimedia.org/wikipedia/commons/3/31/Epic_Games_logo.svg'',
        updated_at = SYSUTCDATETIME()
    WHERE LOWER(name) IN (''epic games'', ''epic games store'')
      AND (logo_url IS NULL OR LTRIM(RTRIM(logo_url)) = '''')
');