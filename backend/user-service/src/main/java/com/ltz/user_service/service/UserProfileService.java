package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.ConnectedAccountRequest;
import com.ltz.user_service.dto.request.PrivacySettingsRequest;
import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.AssignedBadgeResponse;
import com.ltz.user_service.dto.response.ConnectedAccountResponse;
import com.ltz.user_service.dto.response.PrivacySettingsResponse;
import com.ltz.user_service.dto.response.ProfileSectionVisibility;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.entity.ConnectedAccount;
import com.ltz.user_service.entity.PrivacySettings;
import com.ltz.user_service.entity.UserAssignedBadge;
import com.ltz.user_service.entity.UserProfile;
import com.ltz.user_service.repository.ConnectedAccountRepository;
import com.ltz.user_service.repository.PrivacySettingsRepository;
import com.ltz.user_service.repository.UserAssignedBadgeRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.exception.BadRequestException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.util.ClientRequestContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
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
public class UserProfileService {

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

        // Privacy check
        String currentUserId = getCurrentUserId();
        PrivacySettings settings = privacySettingsRepository.findByUserId(userId).orElse(null);
        if (settings != null && ("PRIVATE".equalsIgnoreCase(settings.getProfileVisibility()) || "FRIENDS_ONLY".equalsIgnoreCase(settings.getProfileVisibility()))) {
            if (currentUserId == null || !currentUserId.equals(userId)) {
                throw new org.springframework.security.access.AccessDeniedException("Bu profil gizlidir.");
            }
        }

        return mapToProfileResponse(profile, currentUserId);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfileByUsername(String username) {
        UserProfile profile = userProfileRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for username: " + username));

        // Privacy check
        String currentUserId = getCurrentUserId();
        PrivacySettings settings = privacySettingsRepository.findByUserId(profile.getUserId()).orElse(null);
        if (settings != null && ("PRIVATE".equalsIgnoreCase(settings.getProfileVisibility()) || "FRIENDS_ONLY".equalsIgnoreCase(settings.getProfileVisibility()))) {
            if (currentUserId == null || !currentUserId.equals(profile.getUserId())) {
                throw new org.springframework.security.access.AccessDeniedException("Bu profil gizlidir.");
            }
        }

        return mapToProfileResponse(profile, currentUserId);
    }

    private String getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof JwtUserPrincipal) {
            return ((JwtUserPrincipal) auth.getPrincipal()).userId().toString();
        }
        return null;
    }

    @Transactional
    public void touchLastSeenIfNeeded(String userId) {
        userProfileRepository.findByUserId(userId).ifPresent(profile -> {
            LocalDateTime now = LocalDateTime.now();
            if (profile.getLastSeenAt() == null
                    || profile.getLastSeenAt().isBefore(now.minusMinutes(5))) {
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
        String normalized = role.toUpperCase().replace("ROLE_", "");
        userProfileRepository.findByUserId(userId).ifPresent(profile -> {
            if (!normalized.equals(profile.getRole())) {
                profile.setRole(normalized);
                userProfileRepository.save(profile);
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
        auditLogService.log(userId, isNew ? "CREATE_PROFILE" : "UPDATE_PROFILE", details, context);

        return mapToProfileResponse(saved);
    }

    /**
     * Kullanıcının gizlilik tercihlerini (örneğin kütüphane, donanım veya arkadaş listesi gizliliği) çeker.
     * Eğer henüz kaydı yoksa varsayılan ayarlarla (PUBLIC) anında oluşturup döner.
     */
    @Transactional(readOnly = true)
    public PrivacySettingsResponse getPrivacySettings(String userId) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(userId)
                .orElseGet(() -> privacySettingsRepository.save(PrivacySettings.builder().userId(userId).build()));
        return mapToPrivacyResponse(settings);
    }

    /**
     * Kullanıcının gizlilik ayarlarını günceller.
     */
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

        // Asenkron Audit Loglama
        auditLogService.log(userId, "UPDATE_PRIVACY", "Privacy settings modified", context);

        return mapToPrivacyResponse(saved);
    }

    /**
     * Kullanıcıya ait tüm bağlı üçüncü taraf hesapları listeler.
     */
    @Transactional(readOnly = true)
    public List<ConnectedAccountResponse> getConnectedAccounts(String userId) {
        return connectedAccountRepository.findByUserId(userId).stream()
                .map(this::mapToConnectedAccountResponse)
                .collect(Collectors.toList());
    }

    /**
     * Steam, Discord vb. platform hesaplarını bağlar veya zaten bağlıysa günceller.
     * 
     * 📌 VERİTABANI KISITI KORUMASI:
     * - platformName büyük harfe çevrilerek (uppercase) kaydedilir (Uyum ve standardizasyon için).
     * - Eşsizlik kısıtlaması nedeniyle veritabanı duplicate kaydı reddeder ve GlobalExceptionHandler yakalar.
     */
    @Transactional
    public ConnectedAccountResponse connectAccount(String userId, ConnectedAccountRequest request, ClientRequestContext context) {
        Optional<ConnectedAccount> existing = connectedAccountRepository
                .findByUserIdAndPlatformName(userId, request.getPlatformName().toUpperCase());

        ConnectedAccount account;
        boolean isNew = !existing.isPresent();
        if (existing.isPresent()) {
            // Hesap önceden bağlanmışsa bilgilerini güncelle
            account = existing.get();
            account.setPlatformUserId(request.getPlatformUserId());
            account.setPlatformUsername(request.getPlatformUsername());
        } else {
            // İlk kez bağlanıyorsa yeni kayıt oluştur
            account = ConnectedAccount.builder()
                    .userId(userId)
                    .platformName(request.getPlatformName().toUpperCase())
                    .platformUserId(request.getPlatformUserId())
                    .platformUsername(request.getPlatformUsername())
                    .build();
        }

        ConnectedAccount saved = connectedAccountRepository.save(account);

        // Asenkron Audit Loglama
        auditLogService.log(userId, isNew ? "CONNECT_ACCOUNT" : "UPDATE_CONNECTED_ACCOUNT",
                "Linked platform: " + request.getPlatformName().toUpperCase(), context);

        return mapToConnectedAccountResponse(saved);
    }

    /**
     * Bağlı bir hesabı kaldırır/bağlantısını keser.
     * 
     * 🔐 GÜVENLİK DUVARI:
     * - İsteği atan kullanıcının (userId), silinmeye çalışılan hesabın gerçek sahibi olup olmadığı kontrol edilir.
     * - Yetkisiz silme denemelerinde BadRequestException fırlatılır.
     */
    @Transactional
    public void disconnectAccount(String userId, Long id, ClientRequestContext context) {
        ConnectedAccount account = connectedAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Connected account not found"));

        // Yetki denetimi: Sadece hesabın asıl sahibi bağlantıyı koparabilir.
        if (!account.getUserId().equals(userId)) {
            throw new BadRequestException("Unauthorized to disconnect this account");
        }

        connectedAccountRepository.delete(account);

        // Asenkron Audit Loglama
        auditLogService.log(userId, "DISCONNECT_ACCOUNT", "Disconnected platform: " + account.getPlatformName(), context);
    }

    // ==========================================
    // 🔄 DTO MAPPING METOTLARI
    // (Veritabanı Entity modellerini temiz API çıktılarına dönüştürür)
    // ==========================================

    private UserProfileResponse mapToProfileResponse(UserProfile profile) {
        return mapToProfileResponse(profile, getCurrentUserId());
    }

    private boolean isVisibilityAllowedForViewer(String visibility, boolean isOwner) {
        if (isOwner) {
            return true;
        }
        if (visibility == null || "PUBLIC".equalsIgnoreCase(visibility)) {
            return true;
        }
        return false;
    }

    private UserProfileResponse mapToProfileResponse(UserProfile profile, String viewerUserId) {
        boolean isOwner = viewerUserId != null && viewerUserId.equals(profile.getUserId());
        PrivacySettings settings = privacySettingsRepository.findByUserId(profile.getUserId()).orElse(null);

        boolean showHardware = isVisibilityAllowedForViewer(
                settings != null ? settings.getHardwareVisibility() : "PUBLIC", isOwner);
        boolean showFriendList = isVisibilityAllowedForViewer(
                settings != null ? settings.getFriendListVisibility() : "PUBLIC", isOwner);
        boolean showFollowerList = isVisibilityAllowedForViewer(
                settings != null ? settings.getFollowerListVisibility() : "PUBLIC", isOwner);
        boolean showLastSeen = isVisibilityAllowedForViewer(
                settings != null ? settings.getLastSeenVisibility() : "PUBLIC", isOwner);
        boolean showGameLibrary = isVisibilityAllowedForViewer(
                settings != null ? settings.getGameLibraryVisibility() : "PUBLIC", isOwner);

        ProfileSectionVisibility sectionVisibility = ProfileSectionVisibility.builder()
                .showHardware(showHardware)
                .showFriendList(showFriendList)
                .showFollowerList(showFollowerList)
                .showLastSeen(showLastSeen || isOwner)
                .showGameLibrary(showGameLibrary)
                .build();

        List<ConnectedAccountResponse> connected = connectedAccountRepository.findByUserId(profile.getUserId()).stream()
                .map(this::mapToConnectedAccountResponse)
                .collect(Collectors.toList());

        List<AssignedBadgeResponse> assignedBadges = userAssignedBadgeRepository.findByUserId(profile.getUserId()).stream()
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
                .connectedAccounts(connected)
                .role(profile.getRole())
                .lastSeenAt(showLastSeen || isOwner ? profile.getLastSeenAt() : null)
                .sectionVisibility(sectionVisibility)
                .assignedBadges(assignedBadges)
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
                .followerListVisibility(settings.getFollowerListVisibility())
                .lastSeenVisibility(settings.getLastSeenVisibility())
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

        // Bulk load profiles and settings
        List<UserProfile> profiles = userProfileRepository.findAllByUserIdIn(cleanIds);
        List<PrivacySettings> settingsList = privacySettingsRepository.findAllByUserIdIn(cleanIds);

        java.util.Map<String, PrivacySettings> settingsMap = settingsList.stream()
                .collect(Collectors.toMap(PrivacySettings::getUserId, s -> s, (s1, s2) -> s1));

        String currentUserId = getCurrentUserId();

        return profiles.stream()
                .filter(profile -> {
                    PrivacySettings settings = settingsMap.get(profile.getUserId());
                    if (settings != null && ("PRIVATE".equalsIgnoreCase(settings.getProfileVisibility()) 
                            || "FRIENDS_ONLY".equalsIgnoreCase(settings.getProfileVisibility()))) {
                        // Secure gating: Private profiles are only returned if requested by their owner.
                        return currentUserId != null && currentUserId.equals(profile.getUserId());
                    }
                    return true;
                })
                .map(p -> mapToProfileResponse(p, currentUserId))
                .collect(Collectors.toList());
    }
}


