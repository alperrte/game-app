IF COL_LENGTH('games', 'system_requirement_only') IS NULL
BEGIN
    ALTER TABLE games
        ADD system_requirement_only BIT NOT NULL
            CONSTRAINT df_games_system_requirement_only DEFAULT 0;
END;

EXEC('
    UPDATE games
    SET system_requirement_only = 1
    WHERE category_id IS NULL
      AND EXISTS (
          SELECT 1
          FROM game_system_requirements
          WHERE game_system_requirements.game_id = games.id
      )
');
