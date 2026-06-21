CREATE TABLE hardware_reviews (
                                  id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                  user_id BIGINT NOT NULL,
                                  component_id BIGINT NOT NULL,

                                  review_type NVARCHAR(50) NOT NULL,

                                  rating INT NULL,

                                  title NVARCHAR(200) NOT NULL,
                                  content NVARCHAR(MAX) NOT NULL,

                                  pros NVARCHAR(MAX) NULL,
                                  cons NVARCHAR(MAX) NULL,

                                  usage_duration_months INT NULL,

                                  verified_owner BIT NOT NULL DEFAULT 0,

                                  like_count INT NOT NULL DEFAULT 0,
                                  report_count INT NOT NULL DEFAULT 0,

                                  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                  updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

                                  CONSTRAINT fk_hardware_reviews_component
                                      FOREIGN KEY (component_id) REFERENCES hardware_components(id),

                                  CONSTRAINT ck_hardware_reviews_review_type
                                      CHECK (review_type IN (
                                                             'REVIEW',
                                                             'ISSUE',
                                                             'RECOMMENDATION',
                                                             'QUESTION',
                                                             'EXPERIENCE'
                                          )),

                                  CONSTRAINT ck_hardware_reviews_rating
                                      CHECK (rating IS NULL OR rating BETWEEN 1 AND 10),

                                  CONSTRAINT ck_hardware_reviews_usage_duration
                                      CHECK (usage_duration_months IS NULL OR usage_duration_months >= 0),

                                  CONSTRAINT ck_hardware_reviews_like_count
                                      CHECK (like_count >= 0),

                                  CONSTRAINT ck_hardware_reviews_report_count
                                      CHECK (report_count >= 0)
);