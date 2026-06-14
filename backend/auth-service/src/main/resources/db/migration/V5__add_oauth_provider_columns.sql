-- LobbyTwoZero Auth Service - OAuth Provider Columns (Steam / Discord ortak)
-- Yerel (LOCAL) kullanıcılar ile harici sağlayıcı (STEAM / DISCORD) kullanıcılarını ayırır.

-- 1) Sağlayıcı kolonları
ALTER TABLE user_credentials
    ADD provider NVARCHAR(20) NOT NULL
            CONSTRAINT df_user_credentials_provider DEFAULT 'LOCAL',
        provider_id NVARCHAR(100) NULL;
GO

-- 2) OAuth kullanıcılarının şifresi olmadığı için password_hash artık NULL olabilir.
ALTER TABLE user_credentials
    ALTER COLUMN password_hash NVARCHAR(255) NULL;
GO

-- 3) Aynı (provider, provider_id) ile yalnızca tek kullanıcı olabilir.
--    Filtreli index: yalnızca provider_id dolu olan (OAuth) kayıtlara uygulanır;
--    LOCAL kullanıcılarda provider_id NULL olduğu için kapsanmaz.
CREATE UNIQUE INDEX ux_user_credentials_provider
    ON user_credentials (provider, provider_id)
    WHERE provider_id IS NOT NULL;
GO
