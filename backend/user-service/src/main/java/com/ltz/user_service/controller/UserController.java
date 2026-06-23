package com.ltz.user_service.controller;

import com.ltz.user_service.client.AuthServiceClient;
import com.ltz.user_service.dto.client.response.UserInfoResponse;
import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.request.UserProfilesBatchRequest;
import com.ltz.user_service.dto.response.AuditLogResponse;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.service.UserProfileService;
import com.ltz.user_service.service.ProfileIntegrationService;
import com.ltz.user_service.util.ClientRequestContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.ltz.user_service.dto.client.response.ReviewClientResponse;
import com.ltz.user_service.dto.client.response.SocialClientResponse;
import com.ltz.user_service.dto.client.response.SocialPostClientResponse;
import com.ltz.user_service.dto.response.ProfileRelationshipResponse;
import com.ltz.user_service.dto.response.ProfileSocialConnectionsResponse;

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
    private final AuthServiceClient authServiceClient;
    private final HttpServletRequest httpServletRequest;
    private final ProfileIntegrationService profileIntegrationService;

    public UserController(UserProfileService userProfileService,
            AuthServiceClient authServiceClient,
            HttpServletRequest httpServletRequest,
            ProfileIntegrationService profileIntegrationService) {
        this.userProfileService = userProfileService;
        this.authServiceClient = authServiceClient;
        this.httpServletRequest = httpServletRequest;
        this.profileIntegrationService = profileIntegrationService;
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
     * 📝 Kullanıcının İncelemelerini Çekme (review-service üzerinden)
     */
    @GetMapping("/profile/{userId}/reviews")
    public ResponseEntity<List<ReviewClientResponse>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(profileIntegrationService.getReviews(userId));
    }

    /**
     * 🔍 Profil Çekme (Kullanıcı Adı ile)
     */
    @GetMapping("/profile/username/{username}")
    public ResponseEntity<UserProfileResponse> getProfileByUsername(@PathVariable String username) {
        return ResponseEntity.ok(userProfileService.getProfileByUsername(username));
    }

    /**
     * 👤 Kendi Profilimi Çekme
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal JwtUserPrincipal principal) {
        String userId = userId(principal);
        if (!userProfileService.profileExists(userId)) {
            UserInfoResponse authUser = authServiceClient.getUserById(principal.userId());
            userProfileService.createOrUpdateProfile(userId, authUser.getUsername(), authUser.getEmail(), null,
                    getClientContext());
        }
        userProfileService.syncRoleFromJwt(userId, principal.role());
        userProfileService.touchLastSeenIfNeeded(userId);
        return ResponseEntity.ok(userProfileService.getProfile(userId));
    }

    /**
     * 🆕 Profil Kurulumu (İlk Giriş)
     */
    @PostMapping("/profile/setup")
    public ResponseEntity<UserProfileResponse> setupProfile(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @Valid @RequestBody(required = false) UserProfileRequest request) {
        String uid = userId(principal);
        UserInfoResponse authUser = authServiceClient.getUserById(principal.userId());
        userProfileService.syncRoleFromJwt(uid, authUser.getRole());
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(uid, authUser.getUsername(),
                authUser.getEmail(), request, getClientContext()));
    }

    /**
     * ✏️ Profil Güncelleme
     */
    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody UserProfileRequest request) {
        String userId = userId(principal);
        UserInfoResponse authUser = authServiceClient.getUserById(principal.userId());
        userProfileService.syncRoleFromJwt(userId, authUser.getRole());
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId, authUser.getUsername(),
                authUser.getEmail(), request, getClientContext()));
    }

    /**
     * 👁️ Gizlilik Tercihleri Çekme
     */
    @GetMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> getPrivacySettings(
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getPrivacySettings(userId(principal)));
    }

    /**
     * ⚙️ Gizlilik Tercihleri Güncelleme
     */
    @PutMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> updatePrivacySettings(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody PrivacySettingsRequest request) {
        return ResponseEntity
                .ok(userProfileService.updatePrivacySettings(userId(principal), request, getClientContext()));
    }

    /**
     * 👥 Kullanıcının Arkadaşlar Listesini Çekme (social-service üzerinden)
     */
    @GetMapping("/profile/{userId}/friends")
    public ResponseEntity<List<SocialClientResponse>> getUserFriends(@PathVariable Long userId) {
        return ResponseEntity.ok(profileIntegrationService.getSocialConnections(userId).getFriends());
    }

    /**
     * 📝 Kullanıcının Duvarındaki Gönderileri Çekme (social-service üzerinden)
     */
    @GetMapping("/profile/{userId}/posts")
    public ResponseEntity<List<SocialPostClientResponse>> getUserPosts(@PathVariable Long userId) {
        return ResponseEntity.ok(profileIntegrationService.getPosts(userId));
    }

    @GetMapping("/profile/{userId}/social-connections")
    public ResponseEntity<ProfileSocialConnectionsResponse> getSocialConnections(@PathVariable Long userId) {
        return ResponseEntity.ok(profileIntegrationService.getSocialConnections(userId));
    }

    @GetMapping("/profile/{userId}/relationship")
    public ResponseEntity<ProfileRelationshipResponse> getRelationship(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long userId) {
        return ResponseEntity.ok(profileIntegrationService.getRelationship(principal.userId(), userId));
    }

    /**
     * 🔗 Bağlı Hesapları Listeleme
     */
    @GetMapping("/connected-accounts")
    public ResponseEntity<List<ConnectedAccountResponse>> getConnectedAccounts(
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getConnectedAccounts(userId(principal)));
    }

    /**
     * ➕ Yeni Hesap Bağlama
     */
    @PostMapping("/connected-accounts")
    public ResponseEntity<ConnectedAccountResponse> connectAccount(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody ConnectedAccountRequest request) {
        return ResponseEntity.ok(userProfileService.connectAccount(userId(principal), request, getClientContext()));
    }

    /**
     * ➖ Bağlı Hesap Bağlantısını Kesme
     */
    @DeleteMapping("/connected-accounts/{id}")
    public ResponseEntity<Void> disconnectAccount(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id) {
        userProfileService.disconnectAccount(userId(principal), id, getClientContext());
        return ResponseEntity.noContent().build();
    }

    /**
     * 📁 Profil Resmi / Tema GIF Yükleme Uç Noktası
     */
    @PostMapping(value = "/profile/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> uploadProfileFile(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type // "avatar" | "cover" | "background"
    ) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/") || "image/gif".equals(contentType)) {
            throw new BadRequestException("Only static image uploads are allowed (JPEG, PNG, WebP).");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.toLowerCase().endsWith(".gif")) {
            throw new BadRequestException("GIF uploads are not allowed.");
        }

        try {
            String uploadsDir = "uploads/";
            File directory = new File(uploadsDir).getAbsoluteFile();
            if (!directory.exists()) {
                directory.mkdirs();
            }

            String userId = userId(principal);
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
            } else if ("background".equalsIgnoreCase(type)) {
                request.setProfileBackgroundUrl(fileUrl);
            } else {
                throw new BadRequestException("Invalid upload type: " + type);
            }

            UserProfileResponse updated = userProfileService.createOrUpdateProfile(userId, existing.getUsername(),
                    existing.getEmail(), request, getClientContext());
            return ResponseEntity.ok(updated);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save uploaded file locally.", e);
        }
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogResponse>> getMyAuditLogs(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getAuditLogs(userId(principal), principal.role()));
    }

    /**
     * 👥 Toplu Profil Sorgulama (Batch API)
     */
    @PostMapping("/profiles/batch")
    public ResponseEntity<List<UserProfileResponse>> getProfilesBatch(
            @Valid @RequestBody UserProfilesBatchRequest request) {
        return ResponseEntity.ok(userProfileService.getProfilesBatch(request.getUserIds()));
    }

    private ClientRequestContext getClientContext() {
        return ClientRequestContext.from(httpServletRequest);
    }

    private String userId(JwtUserPrincipal principal) {
        return principal.userId().toString();
    }
}
