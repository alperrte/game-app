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
import com.ltz.user_service.exception.ResourceNotFoundException;
import com.ltz.user_service.exception.BadRequestException;

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
    private final AuditLogService auditLogService;

    // Dependency Injection (Constructor Injection) kullanılmıştır.
    public UserProfileService(UserProfileRepository userProfileRepository,
                              PrivacySettingsRepository privacySettingsRepository,
                              ConnectedAccountRepository connectedAccountRepository,
                              AuditLogService auditLogService) {
        this.userProfileRepository = userProfileRepository;
        this.privacySettingsRepository = privacySettingsRepository;
        this.connectedAccountRepository = connectedAccountRepository;
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
        return mapToProfileResponse(profile);
    }

    /**
     * Kullanıcı profil bilgilerini günceller veya kullanıcı ilk defa sisteme girdiyse yeni profil oluşturur.
     * 
     * 📌 YAN ETKİ (Side Effect) YÖNETİMİ:
     * - Profil ilk defa oluşturuluyorsa, kullanıcının varsayılan gizlilik ayarları da (`PrivacySettings`)
     *   arka planda otomatik olarak oluşturulur ve kaydedilir.
     */
    @Transactional
    public UserProfileResponse createOrUpdateProfile(String userId, String username, String email, UserProfileRequest request, String ipAddress) {
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
        }

        UserProfile saved = userProfileRepository.save(profile);

        // Kullanıcının varsayılan gizlilik ayarlarının veritabanında var olduğundan emin ol (Yoksa oluştur)
        if (!privacySettingsRepository.findByUserId(userId).isPresent()) {
            privacySettingsRepository.save(PrivacySettings.builder().userId(userId).build());
        }

        // Asenkron Audit Loglama
        String details = isNew ? "Profile initialized for user " + username : "Profile fields updated";
        auditLogService.log(userId, isNew ? "CREATE_PROFILE" : "UPDATE_PROFILE", details, ipAddress);

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
    public PrivacySettingsResponse updatePrivacySettings(String userId, PrivacySettingsRequest request, String ipAddress) {
        PrivacySettings settings = privacySettingsRepository.findByUserId(userId)
                .orElseGet(() -> PrivacySettings.builder().userId(userId).build());

        if (request.getProfileVisibility() != null) settings.setProfileVisibility(request.getProfileVisibility());
        if (request.getGameLibraryVisibility() != null) settings.setGameLibraryVisibility(request.getGameLibraryVisibility());
        if (request.getHardwareVisibility() != null) settings.setHardwareVisibility(request.getHardwareVisibility());
        if (request.getFriendListVisibility() != null) settings.setFriendListVisibility(request.getFriendListVisibility());

        PrivacySettings saved = privacySettingsRepository.save(settings);

        // Asenkron Audit Loglama
        auditLogService.log(userId, "UPDATE_PRIVACY", "Privacy settings modified", ipAddress);

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
    public ConnectedAccountResponse connectAccount(String userId, ConnectedAccountRequest request, String ipAddress) {
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
                "Linked platform: " + request.getPlatformName().toUpperCase(), ipAddress);

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
    public void disconnectAccount(String userId, Long id, String ipAddress) {
        ConnectedAccount account = connectedAccountRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Connected account not found"));

        // Yetki denetimi: Sadece hesabın asıl sahibi bağlantıyı koparabilir.
        if (!account.getUserId().equals(userId)) {
            throw new BadRequestException("Unauthorized to disconnect this account");
        }

        connectedAccountRepository.delete(account);

        // Asenkron Audit Loglama
        auditLogService.log(userId, "DISCONNECT_ACCOUNT", "Disconnected platform: " + account.getPlatformName(), ipAddress);
    }

    // ==========================================
    // 🔄 DTO MAPPING METOTLARI
    // (Veritabanı Entity modellerini temiz API çıktılarına dönüştürür)
    // ==========================================

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
                .profileThemeUrl(profile.getProfileThemeUrl())
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
