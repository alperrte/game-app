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

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserProfileService userProfileService;

    public UserController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("user-service is running");
    }

    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable String userId) {
        return ResponseEntity.ok(userProfileService.getProfile(userId));
    }

    @PostMapping("/profile/setup")
    public ResponseEntity<UserProfileResponse> setupProfile(
            @AuthenticationPrincipal String userId,
            @RequestParam String username,
            @RequestParam String email,
            @Valid @RequestBody(required = false) UserProfileRequest request
    ) {
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId, username, email, request));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody UserProfileRequest request
    ) {
        // Find existing profile to get email/username, or fallback to dummy since they won't change on simple update
        UserProfileResponse existing = userProfileService.getProfile(userId);
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId, existing.getUsername(), existing.getEmail(), request));
    }

    @GetMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> getPrivacySettings(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userProfileService.getPrivacySettings(userId));
    }

    @PutMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> updatePrivacySettings(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody PrivacySettingsRequest request
    ) {
        return ResponseEntity.ok(userProfileService.updatePrivacySettings(userId, request));
    }

    @GetMapping("/connected-accounts")
    public ResponseEntity<List<ConnectedAccountResponse>> getConnectedAccounts(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(userProfileService.getConnectedAccounts(userId));
    }

    @PostMapping("/connected-accounts")
    public ResponseEntity<ConnectedAccountResponse> connectAccount(
            @AuthenticationPrincipal String userId,
            @Valid @RequestBody ConnectedAccountRequest request
    ) {
        return ResponseEntity.ok(userProfileService.connectAccount(userId, request));
    }

    @DeleteMapping("/connected-accounts/{id}")
    public ResponseEntity<Void> disconnectAccount(
            @AuthenticationPrincipal String userId,
            @PathVariable Long id
    ) {
        userProfileService.disconnectAccount(userId, id);
        return ResponseEntity.noContent().build();
    }
}
