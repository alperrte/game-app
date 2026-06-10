
CREATE TABLE chat_rooms (
                            id BIGINT IDENTITY(1,1) PRIMARY KEY,

                            room_name NVARCHAR(100) NULL,
                            room_type VARCHAR(20) NOT NULL,

                            created_by_user_id BIGINT NOT NULL,

                            created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
                            updated_at DATETIME2 NULL,

                            CONSTRAINT chk_chat_room_type
                                CHECK (room_type IN ('DIRECT', 'GROUP'))
);