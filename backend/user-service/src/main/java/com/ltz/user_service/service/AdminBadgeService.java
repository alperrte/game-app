package com.ltz.user_service.service;

import com.ltz.user_service.dto.request.AssignBadgeRequest;
import lombok.extern.slf4j.Slf4j;
import com.ltz.user_service.dto.response.AssignedBadgeResponse;
import com.ltz.user_service.dto.response.BadgeCatalogItemResponse;
import com.ltz.user_service.entity.UserAssignedBadge;
import com.ltz.user_service.exception.BadRequestException;
import com.ltz.user_service.repository.UserAssignedBadgeRepository;
import com.ltz.user_service.repository.UserProfileRepository;
import com.ltz.user_service.util.ClientRequestContext;
import com.ltz.user_service.entity.UserRole;
import com.ltz.user_service.entity.AuditAction;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class AdminBadgeService {

    private static final List<BadgeCatalogItemResponse> CATALOG = List.of(
            new BadgeCatalogItemResponse("pioneer", "Öncü"),
            new BadgeCatalogItemResponse("steam", "Steam Bağlı"),
            new BadgeCatalogItemResponse("discord", "Discord Bağlı"),
            new BadgeCatalogItemResponse("audiophile", "Müzikçi"),
            new BadgeCatalogItemResponse("customizer", "Özelleştirici"),
            new BadgeCatalogItemResponse("influencer", "Etkileyici"),
            new BadgeCatalogItemResponse("connector", "Bağlantı Ustası"),
            new BadgeCatalogItemResponse("vip", "VIP Üye"),
            new BadgeCatalogItemResponse("moderator_pick", "Moderatör Seçimi")
    );

    private static final Set<String> VALID_KEYS = CATALOG.stream()
            .map(BadgeCatalogItemResponse::getBadgeKey)
            .collect(Collectors.toSet());

    private final UserAssignedBadgeRepository badgeRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuditLogService auditLogService;

    public AdminBadgeService(
            UserAssignedBadgeRepository badgeRepository,
            UserProfileRepository userProfileRepository,
            AuditLogService auditLogService) {
        this.badgeRepository = badgeRepository;
        this.userProfileRepository = userProfileRepository;
        this.auditLogService = auditLogService;
    }

    public void assertAdminRole(String role) {
        UserRole userRole = UserRole.fromString(role);
        if (userRole != UserRole.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Yalnızca yöneticiler bu işlemi yapabilir.");
        }
    }

    @Transactional(readOnly = true)
    public List<BadgeCatalogItemResponse> getCatalog() {
        return CATALOG;
    }

    @Transactional(readOnly = true)
    public List<AssignedBadgeResponse> getUserBadges(String userId) {
        return badgeRepository.findByUserId(userId).stream()
                .map(this::mapBadge)
                .collect(Collectors.toList());
    }

    @Transactional
    public AssignedBadgeResponse assignBadge(
            String targetUserId,
            AssignBadgeRequest request,
            String adminUserId,
            ClientRequestContext context) {
        if (!VALID_KEYS.contains(request.getBadgeKey())) {
            throw new BadRequestException("Geçersiz rozet anahtarı: " + request.getBadgeKey());
        }

        userProfileRepository.findByUserId(targetUserId)
                .orElseThrow(() -> new BadRequestException("Kullanıcı profili bulunamadı."));

        UserAssignedBadge badge = badgeRepository.findByUserIdAndBadgeKey(targetUserId, request.getBadgeKey())
                .orElse(UserAssignedBadge.builder()
                        .userId(targetUserId)
                        .badgeKey(request.getBadgeKey())
                        .build());

        badge.setLabel(request.getLabel());
        badge.setAssignedBy(adminUserId);

        UserAssignedBadge saved = badgeRepository.save(badge);

        auditLogService.log(
                adminUserId,
                AuditAction.ASSIGN_BADGE.name(),
                "Assigned badge " + request.getBadgeKey() + " to user " + targetUserId,
                context);

        log.info("Badge {} successfully assigned to targetUserId: {} by admin: {}", request.getBadgeKey(), targetUserId, adminUserId);

        return mapBadge(saved);
    }

    @Transactional
    public void removeBadge(
            String targetUserId,
            String badgeKey,
            String adminUserId,
            ClientRequestContext context) {
        if (!badgeRepository.findByUserIdAndBadgeKey(targetUserId, badgeKey).isPresent()) {
            throw new BadRequestException("Rozet bulunamadı.");
        }

        badgeRepository.deleteByUserIdAndBadgeKey(targetUserId, badgeKey);

        auditLogService.log(
                adminUserId,
                AuditAction.REMOVE_BADGE.name(),
                "Removed badge " + badgeKey + " from user " + targetUserId,
                context);

        log.info("Badge {} successfully removed from targetUserId: {} by admin: {}", badgeKey, targetUserId, adminUserId);
    }

    private AssignedBadgeResponse mapBadge(UserAssignedBadge badge) {
        return AssignedBadgeResponse.builder()
                .badgeKey(badge.getBadgeKey())
                .label(badge.getLabel())
                .assignedBy(badge.getAssignedBy())
                .assignedAt(badge.getAssignedAt())
                .build();
    }
}
