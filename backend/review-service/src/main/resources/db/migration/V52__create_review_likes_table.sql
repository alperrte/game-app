CREATE TABLE review_likes (
                              id BIGINT IDENTITY(1,1) PRIMARY KEY,

                              review_id BIGINT NOT NULL,
                              user_id BIGINT NOT NULL,

                              created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

                              CONSTRAINT fk_review_likes_review
                                  FOREIGN KEY (review_id)
                                      REFERENCES reviews(id)
                                      ON DELETE CASCADE,

                              CONSTRAINT uq_review_likes_review_user UNIQUE (review_id, user_id)
);