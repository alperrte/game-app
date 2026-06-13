package com.ltz.user_service.controller;

import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getProfile(userId(principal)));
    }

    @PostMapping("/profile/setup")
    public ResponseEntity<UserProfileResponse> setupProfile(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @Valid @RequestBody(required = false) UserProfileRequest request
    ) {
        String principalUsername = principal.username() != null ? principal.username() : username;
        String principalEmail = principal.email() != null ? principal.email() : email;
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId(principal), principalUsername, principalEmail, request));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody UserProfileRequest request
    ) {
        String userId = userId(principal);
        UserProfileResponse existing = userProfileService.getProfile(userId);
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(userId, existing.getUsername(), existing.getEmail(), request));
    }

    @GetMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> getPrivacySettings(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getPrivacySettings(userId(principal)));
    }

    @PutMapping("/privacy")
    public ResponseEntity<PrivacySettingsResponse> updatePrivacySettings(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody PrivacySettingsRequest request
    ) {
        return ResponseEntity.ok(userProfileService.updatePrivacySettings(userId(principal), request));
    }

    @GetMapping("/connected-accounts")
    public ResponseEntity<List<ConnectedAccountResponse>> getConnectedAccounts(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return ResponseEntity.ok(userProfileService.getConnectedAccounts(userId(principal)));
    }

    @PostMapping("/connected-accounts")
    public ResponseEntity<ConnectedAccountResponse> connectAccount(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody ConnectedAccountRequest request
    ) {
        return ResponseEntity.ok(userProfileService.connectAccount(userId(principal), request));
    }

    @DeleteMapping("/connected-accounts/{id}")
    public ResponseEntity<Void> disconnectAccount(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long id
    ) {
        userProfileService.disconnectAccount(userId(principal), id);
        return ResponseEntity.noContent().build();
    }

    private String userId(JwtUserPrincipal principal) {
        return principal.userId().toString();
    }
}
