CREATE TABLE friend_requests (
                                 id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                 sender_user_id BIGINT NOT NULL,
                                 receiver_user_id BIGINT NOT NULL,

                                 status VARCHAR(20) NOT NULL,

                                 created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                                 updated_at DATETIME2 NULL,

                                 CONSTRAINT chk_friend_request_status
                                     CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),

                                 CONSTRAINT chk_friend_request_not_self
                                     CHECK (sender_user_id <> receiver_user_id)
);

CREATE UNIQUE INDEX uq_friend_requests_sender_receiver
    ON friend_requests(sender_user_id, receiver_user_id);