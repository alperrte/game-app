DECLARE @constraintName NVARCHAR(255);
DECLARE @sql NVARCHAR(MAX);

SELECT @constraintName = kc.name
FROM sys.key_constraints kc
         JOIN sys.index_columns ic
              ON kc.parent_object_id = ic.object_id
                  AND kc.unique_index_id = ic.index_id
         JOIN sys.columns c
              ON ic.object_id = c.object_id
                  AND ic.column_id = c.column_id
WHERE kc.parent_object_id = OBJECT_ID('dbo.game_categories')
  AND kc.type = 'UQ'
  AND c.name = 'name';

IF @constraintName IS NOT NULL
BEGIN
    SET @sql = 'ALTER TABLE dbo.game_categories DROP CONSTRAINT ' + QUOTENAME(@constraintName);
EXEC sp_executesql @sql;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'uq_game_categories_source_name'
      AND object_id = OBJECT_ID('dbo.game_categories')
)
BEGIN
CREATE UNIQUE INDEX uq_game_categories_source_name
    ON dbo.game_categories(source, name)
    WHERE source IS NOT NULL;
END;