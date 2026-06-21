CREATE TABLE hardware_deals (
                                id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                component_id BIGINT NULL,

                                title NVARCHAR(200) NOT NULL,
                                store_name NVARCHAR(150) NULL,

                                old_price DECIMAL(18,2) NULL,
                                new_price DECIMAL(18,2) NULL,
                                currency NVARCHAR(10) NOT NULL DEFAULT 'TRY',
                                discount_percentage DECIMAL(5,2) NULL,

                                deal_url NVARCHAR(1000) NULL,

                                source_type NVARCHAR(50) NOT NULL DEFAULT 'MANUAL',

                                active BIT NOT NULL DEFAULT 1,

                                start_date DATETIME2 NULL,
                                end_date DATETIME2 NULL,

                                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

                                CONSTRAINT fk_hardware_deals_component
                                    FOREIGN KEY (component_id) REFERENCES hardware_components(id),

                                CONSTRAINT ck_hardware_deals_source_type
                                    CHECK (source_type IN (
                                                           'MANUAL',
                                                           'API',
                                                           'SCRAPER',
                                                           'PARTNER'
                                        )),

                                CONSTRAINT ck_hardware_deals_old_price
                                    CHECK (old_price IS NULL OR old_price >= 0),

                                CONSTRAINT ck_hardware_deals_new_price
                                    CHECK (new_price IS NULL OR new_price >= 0),

                                CONSTRAINT ck_hardware_deals_discount_percentage
                                    CHECK (discount_percentage IS NULL OR discount_percentage BETWEEN 0 AND 100)
);