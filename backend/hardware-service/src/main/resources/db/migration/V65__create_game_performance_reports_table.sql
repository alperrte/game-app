CREATE TABLE game_performance_reports (
                                          id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                          user_id BIGINT NOT NULL,
                                          game_id BIGINT NOT NULL,

                                          review_id BIGINT NULL,

                                          cpu_component_id BIGINT NULL,
                                          gpu_component_id BIGINT NULL,

                                          ram_gb INT NULL,

                                          resolution NVARCHAR(50) NULL,
                                          graphics_preset NVARCHAR(50) NULL,

                                          average_fps INT NULL,
                                          minimum_fps INT NULL,
                                          maximum_fps INT NULL,

                                          ray_tracing_enabled BIT NOT NULL DEFAULT 0,
                                          upscaling_type NVARCHAR(50) NULL,

                                          driver_version NVARCHAR(100) NULL,
                                          notes NVARCHAR(MAX) NULL,

                                          created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                          updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

                                          CONSTRAINT fk_game_performance_reports_cpu
                                              FOREIGN KEY (cpu_component_id) REFERENCES hardware_components(id),

                                          CONSTRAINT fk_game_performance_reports_gpu
                                              FOREIGN KEY (gpu_component_id) REFERENCES hardware_components(id),

                                          CONSTRAINT ck_game_performance_reports_graphics_preset
                                              CHECK (graphics_preset IS NULL OR graphics_preset IN (
                                                                                                    'LOW',
                                                                                                    'MEDIUM',
                                                                                                    'HIGH',
                                                                                                    'ULTRA',
                                                                                                    'CUSTOM'
                                                  )),

                                          CONSTRAINT ck_game_performance_reports_upscaling_type
                                              CHECK (upscaling_type IS NULL OR upscaling_type IN (
                                                                                                  'NONE',
                                                                                                  'DLSS',
                                                                                                  'FSR',
                                                                                                  'XESS',
                                                                                                  'TSR',
                                                                                                  'OTHER'
                                                  )),

                                          CONSTRAINT ck_game_performance_reports_ram_gb
                                              CHECK (ram_gb IS NULL OR ram_gb > 0),

                                          CONSTRAINT ck_game_performance_reports_average_fps
                                              CHECK (average_fps IS NULL OR average_fps >= 0),

                                          CONSTRAINT ck_game_performance_reports_minimum_fps
                                              CHECK (minimum_fps IS NULL OR minimum_fps >= 0),

                                          CONSTRAINT ck_game_performance_reports_maximum_fps
                                              CHECK (maximum_fps IS NULL OR maximum_fps >= 0)
);