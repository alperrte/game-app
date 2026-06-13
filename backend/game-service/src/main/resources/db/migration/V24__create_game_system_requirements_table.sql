CREATE TABLE game_system_requirements (
                                          id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                          game_id BIGINT NOT NULL UNIQUE,

                                          minimum_os NVARCHAR(150) NULL,
                                          minimum_cpu NVARCHAR(150) NULL,
                                          minimum_gpu NVARCHAR(150) NULL,
                                          minimum_ram NVARCHAR(100) NULL,
                                          minimum_storage NVARCHAR(100) NULL,

                                          recommended_os NVARCHAR(150) NULL,
                                          recommended_cpu NVARCHAR(150) NULL,
                                          recommended_gpu NVARCHAR(150) NULL,
                                          recommended_ram NVARCHAR(100) NULL,
                                          recommended_storage NVARCHAR(100) NULL,

                                          notes NVARCHAR(1000) NULL,

                                          created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                          updated_at DATETIME2 NULL,

                                          CONSTRAINT fk_game_system_requirements_games
                                              FOREIGN KEY (game_id)
                                                  REFERENCES games(id)
                                                  ON DELETE CASCADE
);