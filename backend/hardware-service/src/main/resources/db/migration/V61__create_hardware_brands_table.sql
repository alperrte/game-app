CREATE TABLE hardware_brands (
                                 id BIGINT IDENTITY(1,1) PRIMARY KEY,
                                 name NVARCHAR(100) NOT NULL,
                                 logo_url NVARCHAR(500) NULL,
                                 website_url NVARCHAR(500) NULL,
                                 active BIT NOT NULL DEFAULT 1,
                                 created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                 updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

                                 CONSTRAINT uq_hardware_brands_name UNIQUE (name)
);

