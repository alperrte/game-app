import { API_BASE_URL } from "../../lib/constants";

/**
 * Bağlı Hesaplar (Steam / Discord) — OAuth entegrasyon anahtarı
 *
 * OAuth hazır olduğunda bu dosyayı güncelle; ConnectedAccountsTab otomatik gerçek akışa geçer.
 *
 * ─── ENTEGRASYON KONTROL LİSTESİ ───────────────────────────────────────────
 *
 * 1. game-service veya auth-service'te OAuth connect endpoint'lerini doğrula:
 *    - Steam kütüphane bağlama (game-service tarafı)
 *    - Discord bağlama (varsa ayrı endpoint)
 *
 * 2. Aşağıdaki CONNECT_OAUTH_ENDPOINTS yollarını gerçek gateway path'leriyle doldur.
 *
 * 3. CONNECTED_ACCOUNTS_OAUTH_ENABLED = true yap.
 *
 * 4. ConnectedAccountsTab.tsx içindeki placeholder UI kaldırılır; bu dosyadaki
 *    startPlatformOAuth() fonksiyonu kullanılır.
 *
 * ─── BEKLENEN AKIŞ (auth-service Steam login ile aynı pattern) ───────────────
 *
 *   Kullanıcı "Steam Bağla" tıklar
 *     → window.location.href = getPlatformConnectUrl("STEAM")
 *   OAuth provider doğrular
 *     → Backend callback'te user-service POST /api/users/connected-accounts kaydı oluşturur
 *     → Frontend profile sayfasına returnTo ile yönlendirilir
 *
 * ─── REFERANS: auth-service (mevcut Steam giriş) ───────────────────────────
 *
 *   GET  /api/auth/steam           → LoginForm.tsx startSteamLogin()
 *   GET  /api/auth/steam/callback  → OAuthCallbackPage token alır
 *
 * ─── REFERANS: user-service (profil bağlantı kaydı) ──────────────────────────
 *
 *   GET    /api/users/connected-accounts
 *   POST   /api/users/connected-accounts   { platformName, platformUserId, platformUsername }
 *   DELETE /api/users/connected-accounts/{id}
 */

/** OAuth endpoint'leri hazır olunca true yap — ConnectedAccountsTab bunu okur. */
export const CONNECTED_ACCOUNTS_OAUTH_ENABLED = false;

/**
 * game-service / auth-service OAuth connect path'leri.
 * Arkadaşın endpoint'leri merge edildiğinde burayı güncelle.
 */
export const CONNECT_OAUTH_ENDPOINTS = {
  steam: "/api/games/steam/connect",
  discord: "/api/games/discord/connect",
} as const;

export type ConnectablePlatform = keyof typeof CONNECT_OAUTH_ENDPOINTS;

/**
 * OAuth bağlantı URL'si üretir. returnTo profil sayfasına geri dönüş içindir.
 */
export const getPlatformConnectUrl = (platform: ConnectablePlatform, returnTo: string): string => {
  const path = CONNECT_OAUTH_ENDPOINTS[platform];
  const params = new URLSearchParams({ returnTo });
  return `${API_BASE_URL}${path}?${params.toString()}`;
};

/**
 * Platform OAuth akışını başlatır. CONNECTED_ACCOUNTS_OAUTH_ENABLED=true iken kullanılır.
 */
export const startPlatformOAuth = (platform: ConnectablePlatform, returnTo: string): void => {
  window.location.href = getPlatformConnectUrl(platform, returnTo);
};
