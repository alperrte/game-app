-- LobbyTwoZero Auth Service - Roles Table
CREATE TABLE roles (
                       id BIGINT IDENTITY(1,1) PRIMARY KEY,

                       name NVARCHAR(50) NOT NULL UNIQUE,

                       created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                       updated_at DATETIME2 NULL
);