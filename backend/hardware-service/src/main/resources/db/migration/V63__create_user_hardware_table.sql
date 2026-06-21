CREATE TABLE user_hardware (
                               id BIGINT IDENTITY(1,1) PRIMARY KEY,

                               user_id BIGINT NOT NULL,

                               cpu_component_id BIGINT NULL,
                               gpu_component_id BIGINT NULL,

                               ram_gb INT NULL,
                               ram_type NVARCHAR(50) NULL,

                               storage_gb INT NULL,
                               storage_type NVARCHAR(50) NULL,

                               motherboard_component_id BIGINT NULL,
                               monitor_component_id BIGINT NULL,
                               keyboard_component_id BIGINT NULL,
                               mouse_component_id BIGINT NULL,
                               headset_component_id BIGINT NULL,

                               operating_system NVARCHAR(150) NULL,
                               monitor_resolution NVARCHAR(50) NULL,
                               monitor_refresh_rate INT NULL,

                               visibility NVARCHAR(50) NOT NULL DEFAULT 'PRIVATE',

                               created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                               updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

                               CONSTRAINT uq_user_hardware_user_id UNIQUE (user_id),

                               CONSTRAINT fk_user_hardware_cpu
                                   FOREIGN KEY (cpu_component_id) REFERENCES hardware_components(id),

                               CONSTRAINT fk_user_hardware_gpu
                                   FOREIGN KEY (gpu_component_id) REFERENCES hardware_components(id),

                               CONSTRAINT fk_user_hardware_motherboard
                                   FOREIGN KEY (motherboard_component_id) REFERENCES hardware_components(id),

                               CONSTRAINT fk_user_hardware_monitor
                                   FOREIGN KEY (monitor_component_id) REFERENCES hardware_components(id),

                               CONSTRAINT fk_user_hardware_keyboard
                                   FOREIGN KEY (keyboard_component_id) REFERENCES hardware_components(id),

                               CONSTRAINT fk_user_hardware_mouse
                                   FOREIGN KEY (mouse_component_id) REFERENCES hardware_components(id),

                               CONSTRAINT fk_user_hardware_headset
                                   FOREIGN KEY (headset_component_id) REFERENCES hardware_components(id),

                               CONSTRAINT ck_user_hardware_visibility
                                   CHECK (visibility IN (
                                                         'PUBLIC',
                                                         'FRIENDS_ONLY',
                                                         'PRIVATE'
                                       )),

                               CONSTRAINT ck_user_hardware_ram_gb
                                   CHECK (ram_gb IS NULL OR ram_gb > 0),

                               CONSTRAINT ck_user_hardware_storage_gb
                                   CHECK (storage_gb IS NULL OR storage_gb > 0)
);