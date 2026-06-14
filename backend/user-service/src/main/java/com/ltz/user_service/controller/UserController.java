package com.ltz.user_service.controller;

import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.service.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;

/**
 * 🎮 UserController
 * 
 * user-service'in REST API kapısıdır. Frontend (React) ile doğrudan haberleşir.
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
     * 👤 Kendi Profilimi Çekme
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getProfile(userId(principal)));
    }

    /**
     * 🆕 Profil Kurulumu (İlk Giriş)
     */
    @PostMapping("/profile/setup")
    public ResponseEntity<UserProfileResponse> setupProfile(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @Valid @RequestBody(required = false) UserProfileRequest request
    ) {
        String principalUsername = principal.username() != null ? principal.username() : username;
        String principalEmail = principal.email() != null ? principal.email() : email;
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId(principal), principalUsername, principalEmail, request, getClientIp()));
    }

    /**
     * ✏️ Profil Güncelleme
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody UserProfileRequest request
    ) {
        String userId = userId(principal);
        UserProfileResponse existing = userProfileService.getProfile(userId);
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId, existing.getUsername(), existing.getEmail(), request, getClientIp()));
    }

    /**
     * 👁️ Gizlilik Tercihleri Çekme
     */
    @GetMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> getPrivacySettings(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getPrivacySettings(userId(principal)));
    }

    /**
     * ⚙️ Gizlilik Tercihleri Güncelleme
     */
    @PutMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> updatePrivacySettings(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody PrivacySettingsRequest request
    ) {
        return ResponseEntity.ok(userProfileService.updatePrivacySettings(userId(principal), request, getClientIp()));
    }

    /**
     * 🔗 Bağlı Hesapları Listeleme
     */
    @GetMapping("/connected-accounts")
    public ResponseEntity<List<ConnectedAccountResponse>> getConnectedAccounts(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getConnectedAccounts(userId(principal)));
    }

    /**
     * ➕ Yeni Hesap Bağlama
     */
    @PostMapping("/connected-accounts")
    public ResponseEntity<ConnectedAccountResponse> connectAccount(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody ConnectedAccountRequest request
    ) {
        return ResponseEntity.ok(userProfileService.connectAccount(userId(principal), request, getClientIp()));
    }

    /**
     * ➖ Bağlı Hesap Bağlantısını Kesme
     */
    @DeleteMapping("/connected-accounts/{id}")
    public ResponseEntity<Void> disconnectAccount(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id
    ) {
        userProfileService.disconnectAccount(userId(principal), id, getClientIp());
        return ResponseEntity.noContent().build();
    }

    /**
     * 📁 Profil Resmi / Tema GIF Yükleme Uç Noktası
     */
    @PostMapping(value = "/profile/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> uploadProfileFile(
            @AuthenticationPrincipal JwtUserPrincipal principal,
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
            File directory = new File(uploadsDir).getAbsoluteFile();
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String userId = userId(principal);
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

    private String getClientIp() {
        String xForwardedFor = httpServletRequest.getHeader("X-Forwarded-For");
        if (xForwardedFor == null || xForwardedFor.isEmpty()) {
            return httpServletRequest.getRemoteAddr();
        }
        return xForwardedFor.split(",")[0].trim();
    }

    private String userId(JwtUserPrincipal principal) {
        return principal.userId().toString();
    }
}
