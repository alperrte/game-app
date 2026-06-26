package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import lombok.extern.slf4j.Slf4j;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.entity.PrivacySettings;
import com.ltz.user_service.entity.AuditAction;
import com.ltz.user_service.repository.PrivacySettingsRepository;
import com.ltz.user_service.util.ClientRequestContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
public class PrivacySettingsService {

    private final PrivacySettingsRepository privacySettingsRepository;
    private final AuditLogService auditLogService;

    public PrivacySettingsService(PrivacySettingsRepository privacySettingsRepository,
                                  AuditLogService auditLogService) {
        this.privacySettingsRepository = privacySettingsRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional(readOnly = true)
    public PrivacySettingsResponse getPrivacySettings(String userId) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(userId)
                .orElseGet(() -> privacySettingsRepository.save(PrivacySettings.builder().userId(userId).build()));
        return mapToPrivacyResponse(settings);
    }

    @Transactional
    public PrivacySettingsResponse updatePrivacySettings(String userId, PrivacySettingsRequest request, ClientRequestContext context) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(userId)
                .orElseGet(() -> PrivacySettings.builder().userId(userId).build());

        if (request.getProfileVisibility() != null) settings.setProfileVisibility(request.getProfileVisibility());
        if (request.getGameLibraryVisibility() != null) settings.setGameLibraryVisibility(request.getGameLibraryVisibility());
        if (request.getHardwareVisibility() != null) settings.setHardwareVisibility(request.getHardwareVisibility());
        if (request.getFriendListVisibility() != null) settings.setFriendListVisibility(request.getFriendListVisibility());
        if (request.getFollowerListVisibility() != null) settings.setFollowerListVisibility(request.getFollowerListVisibility());
        if (request.getLastSeenVisibility() != null) settings.setLastSeenVisibility(request.getLastSeenVisibility());

        PrivacySettings saved = privacySettingsRepository.save(settings);

        auditLogService.log(userId, AuditAction.UPDATE_PRIVACY.name(), "Privacy settings modified", context);

        log.info("Privacy settings updated for userId: {}", userId);

        return mapToPrivacyResponse(saved);
    }

    private PrivacySettingsResponse mapToPrivacyResponse(PrivacySettings settings) {
        return PrivacySettingsResponse.builder()
                .userId(settings.getUserId())
                .profileVisibility(settings.getProfileVisibility())
                .gameLibraryVisibility(settings.getGameLibraryVisibility())
                .hardwareVisibility(settings.getHardwareVisibility())
                .friendListVisibility(settings.getFriendListVisibility())
                .followerListVisibility(settings.getFollowerListVisibility())
                .lastSeenVisibility(settings.getLastSeenVisibility())
                .build();
    }
}
