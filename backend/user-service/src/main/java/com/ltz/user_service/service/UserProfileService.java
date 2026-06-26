package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.UserProfileRequest;
import lombok.extern.slf4j.Slf4j;
import com.ltz.user_service.dto.response.AssignedBadgeResponse;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.dto.response.ProfileSectionVisibility;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.entity.ConnectedAccount;
import com.ltz.user_service.entity.PrivacySettings;
import com.ltz.user_service.entity.UserProfile;
import com.ltz.user_service.entity.UserAssignedBadge;
import com.ltz.user_service.repository.ConnectedAccountRepository;
import com.ltz.user_service.repository.PrivacySettingsRepository;
import com.ltz.user_service.repository.UserAssignedBadgeRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ltz.user_service.entity.Visibility;
import com.ltz.user_service.entity.UserRole;
import com.ltz.user_service.entity.AuditAction;
import org.springframework.beans.factory.annotation.Value;
import com.ltz.user_service.exception.ResourceNotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.util.ClientRequestContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 🏆 UserProfileService
 * 
 * Kullanıcı profili, gizlilik ayarları ve bağlı üçüncü taraf hesapların (Steam, Epic, Discord vb.)
 * iş mantığını (Business Logic) yöneten ana servis sınıfıdır.
 * 
 * 📌 TASARIM VE MİMARİ KARARLAR:
 * - Proje kuralları uyarınca Service ve ServiceImpl ayrımı yapılmadan doğrudan tek bir sınıf olarak tasarlanmıştır.
 * - Veritabanı tutarlılığı sağlamak amacıyla veri güncelleyen tüm metotlar `@Transactional` ile korunur.
 * 
 * 🚀 GELECEK MODERNİZASYON ÖNERİLERİ (Gelecek Yazılımcılar İçin Notlar):
 * - **Premium/VIP Tiers:** İleride kullanıcıların profil temalarında GIF kullanması (profileThemeUrl)
 *   veya yükleyebileceği maksimum dosya boyutu, kullanıcının premium rolüne/statüsüne göre burada kısıtlanabilir.
 * - **Event-Driven Architecture:** Yeni profil kurulumu yapıldığında (`createOrUpdateProfile`), diğer mikroservisleri
 *   (Örn: notification-service) haberdar etmek için RabbitMQ veya Kafka üzerinden bir Event yayınlanabilir.
 * - **Platform Enum:** Steam, Discord gibi platform isimleri şu an String olarak alınıyor. İleride platform
 *   çeşitliliği arttıkça buraya bir Java Enum (PlatformType) entegre edilmesi hataları minimize edecektir.
 */
@Service
@Slf4j
public class UserProfileService {

    @Value("${app.user-profile.last-seen-update-interval-minutes:5}")
    private int lastSeenUpdateIntervalMinutes;

    @Value("${app.security.role-prefix:ROLE_}")
    private String rolePrefix;

    private final UserProfileRepository userProfileRepository;
    private final PrivacySettingsRepository privacySettingsRepository;
    private final ConnectedAccountRepository connectedAccountRepository;
    private final UserAssignedBadgeRepository userAssignedBadgeRepository;
    private final AuditLogService auditLogService;

    // Dependency Injection (Constructor Injection) kullanılmıştır.
    public UserProfileService(UserProfileRepository userProfileRepository,
                              PrivacySettingsRepository privacySettingsRepository,
                              ConnectedAccountRepository connectedAccountRepository,
                              UserAssignedBadgeRepository userAssignedBadgeRepository,
                              AuditLogService auditLogService) {
        this.userProfileRepository = userProfileRepository;
        this.privacySettingsRepository = privacySettingsRepository;
        this.connectedAccountRepository = connectedAccountRepository;
        this.userAssignedBadgeRepository = userAssignedBadgeRepository;
        this.auditLogService = auditLogService;
    }

    /**
     * Belirli bir kullanıcının profil detaylarını çeker.
     * profile bulunamazsa ResourceNotFoundException fırlatır (GlobalExceptionHandler tarafından yakalanıp 404 döner).
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for ID: " + userId));

        String currentUserId = getCurrentUserId();
        checkProfilePrivacy(userId, currentUserId);

        return mapToProfileResponse(profile, currentUserId);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByUsername(String username) {
        UserProfile profile = userProfileRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for username: " + username));

        String currentUserId = getCurrentUserId();
        checkProfilePrivacy(profile.getUserId(), currentUserId);

        return mapToProfileResponse(profile, currentUserId);
    }

    private void checkProfilePrivacy(String targetUserId, String currentUserId) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(targetUserId).orElse(null);
        if (settings != null && (settings.getProfileVisibility() == Visibility.PRIVATE || settings.getProfileVisibility() == Visibility.FRIENDS_ONLY)) {
            if (currentUserId == null || !currentUserId.equals(targetUserId)) {
                throw new org.springframework.security.access.AccessDeniedException("Bu profil gizlidir.");
            }
        }
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof JwtUserPrincipal) {
            return ((JwtUserPrincipal) auth.getPrincipal()).userId().toString();
        }
        return null;
    }

    @Transactional(readOnly = true)
    public boolean profileExists(String userId) {
        return userProfileRepository.existsByUserId(userId);
    }

    @Transactional
    public void touchLastSeenIfNeeded(String userId) {
        userProfileRepository.findByUserId(userId).ifPresent(profile -> {
            LocalDateTime now = LocalDateTime.now();
            if (profile.getLastSeenAt() == null
                    || profile.getLastSeenAt().isBefore(now.minusMinutes(lastSeenUpdateIntervalMinutes))) {
                profile.setLastSeenAt(now);
                userProfileRepository.save(profile);
            }
        });
    }

    @Transactional
    public void syncRoleFromJwt(String userId, String role) {
        if (role == null || role.isBlank()) {
            return;
        }
        UserRole userRole = UserRole.fromString(role);
        userProfileRepository.findByUserId(userId).ifPresent(profile -> {
            if (!userRole.name().equals(profile.getRole())) {
                profile.setRole(userRole.name());
                userProfileRepository.save(profile);
                log.info("Role synced from JWT for userId: {} to role: {}", userId, userRole.name());
            }
        });
    }


    /**
     * Kullanıcı profil bilgilerini günceller veya kullanıcı ilk defa sisteme girdiyse yeni profil oluşturur.
     * 
     * 📌 YAN ETKİ (Side Effect) YÖNETİMİ:
     * - Profil ilk defa oluşturuluyorsa, kullanıcının varsayılan gizlilik ayarları da (`PrivacySettings`)
     *   arka planda otomatik olarak oluşturulur ve kaydedilir.
     */
    @Transactional
    public UserProfileResponse createOrUpdateProfile(String userId, String username, String email, UserProfileRequest request, ClientRequestContext context) {
        boolean isNew = !userProfileRepository.findByUserId(userId).isPresent();

        // Profil varsa bul, yoksa veritabanına eklemek üzere yeni bir UserProfile modeli inşa et
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElse(UserProfile.builder().userId(userId).username(username).email(email).build());

        // İstek içeriği boş değilse gelen güncel alanları modele set et (Null-safe güncellemeler)
        if (request != null) {
            if (request.getDisplayName() != null) profile.setDisplayName(request.getDisplayName());
            if (request.getBio() != null) profile.setBio(request.getBio());
            if (request.getAvatarUrl() != null) profile.setAvatarUrl(request.getAvatarUrl());
            if (request.getCoverUrl() != null) profile.setCoverUrl(request.getCoverUrl());
            if (request.getGamerType() != null) profile.setGamerType(request.getGamerType());
            if (request.getFavoriteCategories() != null) profile.setFavoriteCategories(request.getFavoriteCategories());
            if (request.getProfileThemeUrl() != null) profile.setProfileThemeUrl(request.getProfileThemeUrl());
            if (request.getProfileBackgroundUrl() != null) profile.setProfileBackgroundUrl(request.getProfileBackgroundUrl());
            if (request.getProfileMusicUrl() != null) profile.setProfileMusicUrl(request.getProfileMusicUrl());
            if (request.getHardwareCpu() != null) profile.setHardwareCpu(request.getHardwareCpu());
            if (request.getHardwareGpu() != null) profile.setHardwareGpu(request.getHardwareGpu());
            if (request.getHardwareRam() != null) profile.setHardwareRam(request.getHardwareRam());
            if (request.getHardwareOs() != null) profile.setHardwareOs(request.getHardwareOs());
        }

        UserProfile saved = userProfileRepository.save(profile);

        // Kullanıcının varsayılan gizlilik ayarlarının veritabanında var olduğundan emin ol (Yoksa oluştur)
        if (!privacySettingsRepository.findByUserId(userId).isPresent()) {
            privacySettingsRepository.save(PrivacySettings.builder().userId(userId).build());
        }

        // Asenkron Audit Loglama
        String details = isNew ? "Profile initialized for user " + username : "Profile fields updated";
        auditLogService.log(userId, isNew ? AuditAction.CREATE_PROFILE.name() : AuditAction.UPDATE_PROFILE.name(), details, context);

        log.info("Profile successfully created/updated for userId: {}", userId);

        return mapToProfileResponse(saved);
    }



    // ==========================================
    // 🔄 DTO MAPPING METOTLARI
    // (Veritabanı Entity modellerini temiz API çıktılarına dönüştürür)
    // ==========================================

    private UserProfileResponse mapToProfileResponse(UserProfile profile) {
        return mapToProfileResponse(profile, getCurrentUserId());
    }

    private boolean isVisibilityAllowedForViewer(Visibility visibility, boolean isOwner) {
        if (isOwner) {
            return true;
        }
        if (visibility == null || visibility == Visibility.PUBLIC) {
            return true;
        }
        return false;
    }

    private UserProfileResponse mapToProfileResponse(UserProfile profile, String viewerUserId) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(profile.getUserId()).orElse(null);
        List<ConnectedAccount> connected = connectedAccountRepository.findByUserId(profile.getUserId());
        List<UserAssignedBadge> assignedBadges = userAssignedBadgeRepository.findByUserId(profile.getUserId());
        return mapToProfileResponse(profile, viewerUserId, settings, connected, assignedBadges);
    }

    private UserProfileResponse mapToProfileResponse(
            UserProfile profile, 
            String viewerUserId,
            PrivacySettings settings,
            List<ConnectedAccount> connected,
            List<UserAssignedBadge> assignedBadges) {
        boolean isOwner = viewerUserId != null && viewerUserId.equals(profile.getUserId());

        boolean showHardware = isVisibilityAllowedForViewer(
                settings != null ? settings.getHardwareVisibility() : Visibility.PUBLIC, isOwner);
        boolean showFriendList = isVisibilityAllowedForViewer(
                settings != null ? settings.getFriendListVisibility() : Visibility.PUBLIC, isOwner);
        boolean showFollowerList = isVisibilityAllowedForViewer(
                settings != null ? settings.getFollowerListVisibility() : Visibility.PUBLIC, isOwner);
        boolean showLastSeen = isVisibilityAllowedForViewer(
                settings != null ? settings.getLastSeenVisibility() : Visibility.PUBLIC, isOwner);
        boolean showGameLibrary = isVisibilityAllowedForViewer(
                settings != null ? settings.getGameLibraryVisibility() : Visibility.PUBLIC, isOwner);

        ProfileSectionVisibility sectionVisibility = ProfileSectionVisibility.builder()
                .showHardware(showHardware)
                .showFriendList(showFriendList)
                .showFollowerList(showFollowerList)
                .showLastSeen(showLastSeen || isOwner)
                .showGameLibrary(showGameLibrary)
                .build();

        List<ConnectedAccountResponse> connectedResponses = connected.stream()
                .map(this::mapToConnectedAccountResponse)
                .collect(Collectors.toList());

        List<AssignedBadgeResponse> assignedBadgeResponses = assignedBadges.stream()
                .map(badge -> AssignedBadgeResponse.builder()
                        .badgeKey(badge.getBadgeKey())
                        .label(badge.getLabel())
                        .assignedBy(badge.getAssignedBy())
                        .assignedAt(badge.getAssignedAt())
                        .build())
                .collect(Collectors.toList());

        return UserProfileResponse.builder()
                .userId(profile.getUserId())
                .username(profile.getUsername())
                .email(isOwner ? profile.getEmail() : null)
                .displayName(profile.getDisplayName())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .coverUrl(profile.getCoverUrl())
                .gamerType(profile.getGamerType())
                .favoriteCategories(profile.getFavoriteCategories())
                .profileThemeUrl(profile.getProfileThemeUrl())
                .profileBackgroundUrl(profile.getProfileBackgroundUrl())
                .profileMusicUrl(profile.getProfileMusicUrl())
                .hardwareCpu(showHardware ? profile.getHardwareCpu() : null)
                .hardwareGpu(showHardware ? profile.getHardwareGpu() : null)
                .hardwareRam(showHardware ? profile.getHardwareRam() : null)
                .hardwareOs(showHardware ? profile.getHardwareOs() : null)
                .connectedAccounts(connectedResponses)
                .role(profile.getRole())
                .lastSeenAt(showLastSeen || isOwner ? profile.getLastSeenAt() : null)
                .sectionVisibility(sectionVisibility)
                .assignedBadges(assignedBadgeResponses)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
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

    public List<com.ltz.user_service.dto.response.AuditLogResponse> getAuditLogs(String userId, String viewerRole) {
        return auditLogService.getAuditLogResponses(userId, viewerRole);
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getProfilesBatch(List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }

        // Clean and deduplicate IDs
        List<String> cleanIds = userIds.stream()
                .filter(id -> id != null && !id.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());

        if (cleanIds.isEmpty()) {
            return List.of();
        }

        // Bulk load profiles, settings, connected accounts, and assigned badges in exactly 4 database queries total
        List<UserProfile> profiles = userProfileRepository.findAllByUserIdIn(cleanIds);
        List<PrivacySettings> settingsList = privacySettingsRepository.findAllByUserIdIn(cleanIds);
        List<ConnectedAccount> connectedList = connectedAccountRepository.findAllByUserIdIn(cleanIds);
        List<UserAssignedBadge> assignedBadgesList = userAssignedBadgeRepository.findAllByUserIdIn(cleanIds);

        // Map them for O(1) in-memory resolution
        java.util.Map<String, PrivacySettings> settingsMap = settingsList.stream()
                .collect(Collectors.toMap(PrivacySettings::getUserId, s -> s, (s1, s2) -> s1));

        java.util.Map<String, List<ConnectedAccount>> connectedMap = connectedList.stream()
                .collect(Collectors.groupingBy(ConnectedAccount::getUserId));

        java.util.Map<String, List<UserAssignedBadge>> badgesMap = assignedBadgesList.stream()
                .collect(Collectors.groupingBy(UserAssignedBadge::getUserId));

        String currentUserId = getCurrentUserId();

        return profiles.stream()
                .filter(profile -> {
                    PrivacySettings settings = settingsMap.get(profile.getUserId());
                    if (settings != null && (settings.getProfileVisibility() == Visibility.PRIVATE 
                            || settings.getProfileVisibility() == Visibility.FRIENDS_ONLY)) {
                        // Secure gating: Private profiles are only returned if requested by their owner.
                        return currentUserId != null && currentUserId.equals(profile.getUserId());
                    }
                    return true;
                })
                .map(p -> mapToProfileResponse(
                        p, 
                        currentUserId,
                        settingsMap.get(p.getUserId()),
                        connectedMap.getOrDefault(p.getUserId(), List.of()),
                        badgesMap.getOrDefault(p.getUserId(), List.of())
                ))
                .collect(Collectors.toList());
    }
}


