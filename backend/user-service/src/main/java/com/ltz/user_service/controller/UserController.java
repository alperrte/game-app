package com.ltz.user_service.controller;

import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.ltz.user_service.exception.BadRequestException;

import java.io.File;
import java.io.IOException;
import java.util.List;

/**
 * 🎮 UserController
 * 
 * user-service'in REST API kapısıdır. Frontend (React) ile doğrudan haberleşir.
 * 
 * 📌 GÜVENLİK VE ROL ENJEKSİYONU:
 * - `@AuthenticationPrincipal`: API Gateway'den gelen ve JWT doğrulamasından geçen
 *   kullanıcının kimlik bilgisini (userId) doğrudan metot parametresine bağlar.
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;
    private final HttpServletRequest httpServletRequest;

    public UserController(UserProfileService userProfileService, HttpServletRequest httpServletRequest) {
        this.userProfileService = userProfileService;
        this.httpServletRequest = httpServletRequest;
    }

    /**
     * 💚 Sağlık Kontrolü (Health Check)
     */
    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("user-service is running");
    }

    /**
     * 🔍 Profil Çekme
     */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable String userId) {
        return ResponseEntity.ok(userProfileService.getProfile(userId));
    }

    /**
     * 🆕 Profil Kurulumu (İlk Giriş)
     */
    @PostMapping("/profile/setup")
    public ResponseEntity<UserProfileResponse> setupProfile(
            @AuthenticationPrincipal String userId,
            @RequestParam String username,
            @RequestParam String email,
            @Valid @RequestBody(required = false) UserProfileRequest request
    ) {
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId, username, email, request, getClientIp()));
    }

    /**
     * ✏️ Profil Güncelleme
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UserProfileRequest request
    ) {
        UserProfileResponse existing = userProfileService.getProfile(userId);
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId, existing.getUsername(), existing.getEmail(), request, getClientIp()));
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
        return ResponseEntity.ok(userProfileService.updatePrivacySettings(userId, request, getClientIp()));
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
        return ResponseEntity.ok(userProfileService.connectAccount(userId, request, getClientIp()));
    }

    /**
     * ➖ Bağlı Hesap Bağlantısını Kesme
     */
    @DeleteMapping("/connected-accounts/{id}")
    public ResponseEntity<Void> disconnectAccount(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id
    ) {
        userProfileService.disconnectAccount(userId, id, getClientIp());
        return ResponseEntity.noContent().build();
    }

    /**
     * 📁 Profil Resmi / Tema GIF Yükleme Uç Noktası
     * Resimleri uploads/ dizinine kaydeder ve veri tabanına bağlar.
     */
    @PostMapping("/profile/upload")
    public ResponseEntity<UserProfileResponse> uploadProfileFile(
            @AuthenticationPrincipal String userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type // "avatar" | "cover" | "theme"
    ) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty.");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("image/gif"))) {
            throw new BadRequestException("Only image and GIF uploads are allowed.");
        }

        try {
            String uploadsDir = "uploads/";
            File directory = new File(uploadsDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".") 
                    ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                    : ".bin";
            
            String newFilename = userId + "_" + type + "_" + System.currentTimeMillis() + extension;
            File destFile = new File(directory, newFilename);
            file.transferTo(destFile);

            String fileUrl = "/api/users/uploads/" + newFilename;

            UserProfileResponse existing = userProfileService.getProfile(userId);
            UserProfileRequest request = new UserProfileRequest();
            if ("avatar".equalsIgnoreCase(type)) {
                request.setAvatarUrl(fileUrl);
            } else if ("cover".equalsIgnoreCase(type)) {
                request.setCoverUrl(fileUrl);
            } else if ("theme".equalsIgnoreCase(type)) {
                request.setProfileThemeUrl(fileUrl);
            } else {
                throw new BadRequestException("Invalid upload type: " + type);
            }

            UserProfileResponse updated = userProfileService.createOrUpdateProfile(userId, existing.getUsername(), existing.getEmail(), request, getClientIp());
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save uploaded file locally.", e);
        }
    }

    /**
     * API Gateway arkasındaki gerçek istemci IP adresini döner.
     */
    private String getClientIp() {
        String xForwardedFor = httpServletRequest.getHeader("X-Forwarded-For");
        if (xForwardedFor == null || xForwardedFor.isEmpty()) {
            return httpServletRequest.getRemoteAddr();
        }
        return xForwardedFor.split(",")[0].trim();
    }
}
