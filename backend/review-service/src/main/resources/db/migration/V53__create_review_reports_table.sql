CREATE TABLE review_reports (
                                id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                review_id BIGINT NOT NULL,
                                user_id BIGINT NOT NULL,

                                reason NVARCHAR(500) NOT NULL,
                                status NVARCHAR(30) NOT NULL DEFAULT 'PENDING',

                                created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                resolved_at DATETIME2 NULL,

                                CONSTRAINT fk_review_reports_review
                                    FOREIGN KEY (review_id)
                                        REFERENCES reviews(id)
                                        ON DELETE CASCADE,

                                CONSTRAINT chk_review_reports_status CHECK (status IN ('PENDING', 'RESOLVED', 'REJECTED'))
);