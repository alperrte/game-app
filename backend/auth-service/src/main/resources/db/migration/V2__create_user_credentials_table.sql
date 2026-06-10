-- LobbyTwoZero Auth Service - User Credentials Table
CREATE TABLE user_credentials (
                                  id BIGINT IDENTITY(1,1) PRIMARY KEY,

                                  email NVARCHAR(150) NOT NULL UNIQUE,
                                  username NVARCHAR(100) NOT NULL UNIQUE,
                                  password_hash NVARCHAR(255) NOT NULL,

                                  role_id BIGINT NOT NULL,

                                  account_status NVARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

                                  email_verified BIT NOT NULL DEFAULT 0,

                                  last_login_at DATETIME2 NULL,

                                  created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                                  updated_at DATETIME2 NULL,

                                  CONSTRAINT fk_user_credentials_role
                                      FOREIGN KEY (role_id)
                                          REFERENCES roles(id)
);