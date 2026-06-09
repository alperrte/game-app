package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.entity.ConnectedAccount;
import com.ltz.user_service.entity.PrivacySettings;
import com.ltz.user_service.entity.UserProfile;
import com.ltz.user_service.repository.ConnectedAccountRepository;
import com.ltz.user_service.repository.PrivacySettingsRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final PrivacySettingsRepository privacySettingsRepository;
    private final ConnectedAccountRepository connectedAccountRepository;

    public UserProfileService(UserProfileRepository userProfileRepository,
                              PrivacySettingsRepository privacySettingsRepository,
                              ConnectedAccountRepository connectedAccountRepository) {
        this.userProfileRepository = userProfileRepository;
        this.privacySettingsRepository = privacySettingsRepository;
        this.connectedAccountRepository = connectedAccountRepository;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found for ID: " + userId));
        return mapToProfileResponse(profile);
    }

    @Transactional
    public UserProfileResponse createOrUpdateProfile(String userId, String username, String email, UserProfileRequest request) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(UserProfile.builder().userId(userId).username(username).email(email).build());

        if (request != null) {
            if (request.getDisplayName() != null) profile.setDisplayName(request.getDisplayName());
            if (request.getBio() != null) profile.setBio(request.getBio());
            if (request.getAvatarUrl() != null) profile.setAvatarUrl(request.getAvatarUrl());
            if (request.getCoverUrl() != null) profile.setCoverUrl(request.getCoverUrl());
            if (request.getGamerType() != null) profile.setGamerType(request.getGamerType());
            if (request.getFavoriteCategories() != null) profile.setFavoriteCategories(request.getFavoriteCategories());
        }

        UserProfile saved = userProfileRepository.save(profile);

        // Ensure default privacy settings exist
        if (!privacySettingsRepository.findByUserId(userId).isPresent()) {
            privacySettingsRepository.save(PrivacySettings.builder().userId(userId).build());
        }

        return mapToProfileResponse(saved);
    }

    @Transactional(readOnly = true)
    public PrivacySettingsResponse getPrivacySettings(String userId) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(userId)
                .orElseGet(() -> privacySettingsRepository.save(PrivacySettings.builder().userId(userId).build()));
        return mapToPrivacyResponse(settings);
    }

    @Transactional
    public PrivacySettingsResponse updatePrivacySettings(String userId, PrivacySettingsRequest request) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(userId)
                .orElseGet(() -> PrivacySettings.builder().userId(userId).build());

        if (request.getProfileVisibility() != null) settings.setProfileVisibility(request.getProfileVisibility());
        if (request.getGameLibraryVisibility() != null) settings.setGameLibraryVisibility(request.getGameLibraryVisibility());
        if (request.getHardwareVisibility() != null) settings.setHardwareVisibility(request.getHardwareVisibility());
        if (request.getFriendListVisibility() != null) settings.setFriendListVisibility(request.getFriendListVisibility());

        PrivacySettings saved = privacySettingsRepository.save(settings);
        return mapToPrivacyResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ConnectedAccountResponse> getConnectedAccounts(String userId) {
        return connectedAccountRepository.findByUserId(userId).stream()
                .map(this::mapToConnectedAccountResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConnectedAccountResponse connectAccount(String userId, ConnectedAccountRequest request) {
        Optional<ConnectedAccount> existing = connectedAccountRepository
                .findByUserIdAndPlatformName(userId, request.getPlatformName().toUpperCase());

        ConnectedAccount account;
        if (existing.isPresent()) {
            account = existing.get();
            account.setPlatformUserId(request.getPlatformUserId());
            account.setPlatformUsername(request.getPlatformUsername());
        } else {
            account = ConnectedAccount.builder()
                    .userId(userId)
                    .platformName(request.getPlatformName().toUpperCase())
                    .platformUserId(request.getPlatformUserId())
                    .platformUsername(request.getPlatformUsername())
                    .build();
        }

        ConnectedAccount saved = connectedAccountRepository.save(account);
        return mapToConnectedAccountResponse(saved);
    }

    @Transactional
    public void disconnectAccount(String userId, Long id) {
        ConnectedAccount account = connectedAccountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Connected account not found"));

        if (!account.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to disconnect this account");
        }

        connectedAccountRepository.delete(account);
    }

    private UserProfileResponse mapToProfileResponse(UserProfile profile) {
        return UserProfileResponse.builder()
                .userId(profile.getUserId())
                .username(profile.getUsername())
                .email(profile.getEmail())
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .coverUrl(profile.getCoverUrl())
                .gamerType(profile.getGamerType())
                .favoriteCategories(profile.getFavoriteCategories())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    private PrivacySettingsResponse mapToPrivacyResponse(PrivacySettings settings) {
        return PrivacySettingsResponse.builder()
                .userId(settings.getUserId())
                .profileVisibility(settings.getProfileVisibility())
                .gameLibraryVisibility(settings.getGameLibraryVisibility())
                .hardwareVisibility(settings.getHardwareVisibility())
                .friendListVisibility(settings.getFriendListVisibility())
                .build();
    }

    private ConnectedAccountResponse mapToConnectedAccountResponse(ConnectedAccount account) {
        return ConnectedAccountResponse.builder()
                .id(account.getId())
                .userId(account.getUserId())
                .platformName(account.getPlatformName())
                .platformUserId(account.getPlatformUserId())
                .platformUsername(account.getPlatformUsername())
                .connectedAt(account.getConnectedAt())
                .build();
    }
}
