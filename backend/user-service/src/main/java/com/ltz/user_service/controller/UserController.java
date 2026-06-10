package com.ltz.user_service.controller;

import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 🎮 UserController
 * 
 * user-service'in REST API kapısıdır. Frontend (React) ile doğrudan haberleşir.
 * 
 * 📌 GÜVENLİK VE ROL ENJEKSİYONU:
 * - `@AuthenticationPrincipal`: API Gateway'den gelen ve JWT doğrulamasından geçen
 *   kullanıcının kimlik bilgisini (userId) doğrudan metot parametresine bağlar.
 * - Bu sayede Frontend'den gelen taklit edilebilecek "ben buyum" id parametrelerine güvenilmez.
 * 
 * 🚀 GELECEK GELİŞTİRME ÖNERİLERİ:
 * - Swagger / OpenAPI anotasyonları (`@Operation`, `@ApiResponse`) eklenerek API dokümantasyonu
 *   otomatik olarak zenginleştirilebilir.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;

    // Bağımlılık enjeksiyonu constructor aracılığıyla yapılmıştır.
    public UserController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    /**
     * 💚 Sağlık Kontrolü (Health Check)
     * Token gerektirmeden çalışır (CORS/SecurityConfig izinlidir).
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("user-service is running");
    }

    /**
     * 🔍 Profil Çekme
     * Belirli bir kullanıcının profil bilgilerini getirir.
     */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable String userId) {
        return ResponseEntity.ok(userProfileService.getProfile(userId));
    }

    /**
     * 🆕 Profil Kurulumu (İlk Giriş)
     * Kullanıcı ilk kez sisteme üye olduğunda adını, emailini ve varsayılan profilini oluşturmak için tetiklenir.
     */
    @PostMapping("/profile/setup")
    public ResponseEntity<UserProfileResponse> setupProfile(
            @AuthenticationPrincipal String userId,
            @RequestParam String username,
            @RequestParam String email,
            @Valid @RequestBody(required = false) UserProfileRequest request
    ) {
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId, username, email, request));
    }

    /**
     * ✏️ Profil Güncelleme
     * `@Valid`: UserProfileRequest içindeki `@Size` kısıtlarının (bio < 1000) kontrol edilmesini sağlar.
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UserProfileRequest request
    ) {
        // Mevcut kullanıcıyı çekip username/email değerlerini koruyarak profil alanlarını günceller
        UserProfileResponse existing = userProfileService.getProfile(userId);
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId, existing.getUsername(), existing.getEmail(), request));
    }

    /**
     * 👁️ Gizlilik Tercihleri Çekme
     */
    @GetMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> getPrivacySettings(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userProfileService.getPrivacySettings(userId));
    }

    /**
     * ⚙️ Gizlilik Tercihleri Güncelleme
     */
    @PutMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> updatePrivacySettings(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody PrivacySettingsRequest request
    ) {
        return ResponseEntity.ok(userProfileService.updatePrivacySettings(userId, request));
    }

    /**
     * 🔗 Bağlı Hesapları Listeleme (Steam, Epic, Discord vb.)
     */
    @GetMapping("/connected-accounts")
    public ResponseEntity<List<ConnectedAccountResponse>> getConnectedAccounts(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userProfileService.getConnectedAccounts(userId));
    }

    /**
     * ➕ Yeni Hesap Bağlama
     */
    @PostMapping("/connected-accounts")
    public ResponseEntity<ConnectedAccountResponse> connectAccount(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ConnectedAccountRequest request
    ) {
        return ResponseEntity.ok(userProfileService.connectAccount(userId, request));
    }

    /**
     * ➖ Bağlı Hesap Bağlantısını Kesme
     */
    @DeleteMapping("/connected-accounts/{id}")
    public ResponseEntity<Void> disconnectAccount(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id
    ) {
        userProfileService.disconnectAccount(userId, id);
        return ResponseEntity.noContent().build();
    }
}
