CREATE TABLE hardware_components (
                                     id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                     component_type NVARCHAR(50) NOT NULL,
                                     category NVARCHAR(50) NOT NULL,

                                     brand_id BIGINT NULL,

                                     series_name NVARCHAR(150) NULL,
                                     model_name NVARCHAR(200) NOT NULL,
                                     normalized_name NVARCHAR(250) NULL,
                                     aliases NVARCHAR(MAX) NULL,

                                     image_url NVARCHAR(500) NULL,

                                     verified BIT NOT NULL DEFAULT 0,
                                     created_by_user_id BIGINT NULL,

                                     vram_gb INT NULL,
                                     core_count INT NULL,
                                     thread_count INT NULL,
                                     memory_gb INT NULL,
                                     storage_capacity_gb INT NULL,

                                     extra_specs NVARCHAR(MAX) NULL,

                                     active BIT NOT NULL DEFAULT 1,

                                     created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                     updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

                                     CONSTRAINT fk_hardware_components_brand
                                         FOREIGN KEY (brand_id) REFERENCES hardware_brands(id),

                                     CONSTRAINT ck_hardware_components_component_type
                                         CHECK (component_type IN (
                                                                   'CPU',
                                                                   'GPU',
                                                                   'RAM',
                                                                   'STORAGE',
                                                                   'MOTHERBOARD',
                                                                   'MONITOR',
                                                                   'PERIPHERAL',
                                                                   'OTHER'
                                             )),

                                     CONSTRAINT ck_hardware_components_category
                                         CHECK (category IN (
                                                             'PROCESSOR',
                                                             'GRAPHICS_CARD',
                                                             'MEMORY',
                                                             'SSD',
                                                             'HDD',
                                                             'MOTHERBOARD',
                                                             'KEYBOARD',
                                                             'MOUSE',
                                                             'HEADSET',
                                                             'MICROPHONE',
                                                             'CONTROLLER',
                                                             'MONITOR',
                                                             'OTHER'
                                             ))
);