package com.ltz.social_service.service;

import com.ltz.social_service.dto.request.CommunityCreateRequest;
import com.ltz.social_service.dto.request.CommunityUpdateRequest;
import com.ltz.social_service.dto.request.CommunityEventCreateRequest;
import com.ltz.social_service.dto.request.CommunityEventUpdateRequest;
import com.ltz.social_service.dto.response.CommunityInvitationResponse;
import com.ltz.social_service.dto.response.CommunityEventResponse;
import com.ltz.social_service.dto.response.CommunityMemberResponse;
import com.ltz.social_service.dto.response.CommunityResponse;
import com.ltz.social_service.entity.*;
import com.ltz.social_service.enums.*;
import com.ltz.social_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommunityService {

    private final CommunityRepository communityRepository;
    private final CommunityMemberRepository memberRepository;
    private final CommunityEventRepository eventRepository;
    private final CommunityEventParticipantRepository participantRepository;
    private final CommunityInvitationRepository invitationRepository;
    private final PostRepository postRepository;
    private final MediaStorageService mediaStorageService;

    public CommunityResponse createCommunity(Long userId, CommunityCreateRequest request) {
        String name = request.getName().trim();
        if (communityRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalStateException("Bu isimde bir topluluk zaten var.");
        }

        Community saved = communityRepository.save(Community.builder()
                .ownerUserId(userId)
                .name(name)
                .description(request.getDescription().trim())
                .category(trimToNull(request.getCategory()))
                .imageUrl(trimToNull(request.getImageUrl()))
                .membersVisible(true)
                .visibility(request.getVisibility() == null
                        ? CommunityVisibility.PUBLIC
                        : request.getVisibility())
                .build());

        memberRepository.save(CommunityMember.builder()
                .communityId(saved.getId())
                .userId(userId)
                .memberRole(CommunityMemberRole.OWNER)
                .build());
        mediaStorageService.attachMediaToCommunity(saved.getImageUrl(), userId, saved.getId());

        return toCommunityResponse(saved, userId);
    }

    public CommunityResponse updateCommunity(
            Long communityId,
            Long userId,
            CommunityUpdateRequest request
    ) {
        Community community = getCommunity(communityId);
        if (!community.getOwnerUserId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Topluluğu yalnızca sahibi düzenleyebilir.");
        }

        String name = request.getName().trim();
        if (communityRepository.existsByNameIgnoreCaseAndIdNot(name, communityId)) {
            throw new IllegalStateException("Bu isimde bir topluluk zaten var.");
        }

        String previousImageUrl = community.getImageUrl();
        String nextImageUrl = trimToNull(request.getImageUrl());

        community.setName(name);
        community.setDescription(request.getDescription().trim());
        community.setCategory(trimToNull(request.getCategory()));
        community.setImageUrl(nextImageUrl);
        community.setVisibility(request.getVisibility());
        community.setMembersVisible(request.getMembersVisible());

        Community saved = communityRepository.save(community);
        if (!java.util.Objects.equals(previousImageUrl, nextImageUrl)) {
            mediaStorageService.attachMediaToCommunity(nextImageUrl, userId, communityId);
            mediaStorageService.deleteMediaByUrl(previousImageUrl);
        }

        return toCommunityResponse(saved, userId);
    }

    @Transactional(readOnly = true)
    public List<CommunityMemberResponse> getCommunityMembers(
            Long communityId,
            Long userId
    ) {
        Community community = getCommunity(communityId);
        boolean isOwner = community.getOwnerUserId().equals(userId);
        boolean isMember = memberRepository.existsByCommunityIdAndUserId(communityId, userId);

        if (CommunityVisibility.PRIVATE.equals(community.getVisibility()) && !isMember) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bu topluluğun üyelerini görme yetkin yok.");
        }
        if (!isOwner && !Boolean.TRUE.equals(community.getMembersVisible())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Topluluk üye listesi gizli.");
        }

        return memberRepository.findByCommunityIdOrderByJoinedAtAsc(communityId)
                .stream()
                .map(member -> CommunityMemberResponse.builder()
                        .userId(member.getUserId())
                        .role(member.getMemberRole())
                        .joinedAt(member.getJoinedAt())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CommunityResponse> getCommunities(
            Long currentUserId,
            String query,
            int page,
            int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var communities = query == null || query.isBlank()
                ? communityRepository.findByVisibility(CommunityVisibility.PUBLIC, pageable)
                : communityRepository.findByVisibilityAndNameContainingIgnoreCase(
                        CommunityVisibility.PUBLIC,
                        query.trim(),
                        pageable);
        return communities.stream().map(item -> toCommunityResponse(item, currentUserId)).toList();
    }

    @Transactional(readOnly = true)
    public List<CommunityResponse> getMyCommunities(Long userId) {
        return memberRepository.findByUserIdOrderByJoinedAtDesc(userId).stream()
                .map(CommunityMember::getCommunityId)
                .map(communityRepository::findById)
                .flatMap(java.util.Optional::stream)
                .map(item -> toCommunityResponse(item, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public CommunityResponse getCommunityById(Long communityId, Long userId) {
        Community community = getCommunity(communityId);
        if (!canViewCommunity(communityId, userId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bu topluluğu görüntüleme yetkin yok.");
        }
        return toCommunityResponse(community, userId);
    }

    public CommunityResponse joinCommunity(Long communityId, Long userId) {
        Community community = getCommunity(communityId);
        if (CommunityVisibility.PRIVATE.equals(community.getVisibility())) {
            throw new IllegalStateException("Özel topluluklara davet olmadan katılamazsın.");
        }
        if (!memberRepository.existsByCommunityIdAndUserId(communityId, userId)) {
            memberRepository.save(CommunityMember.builder()
                    .communityId(communityId)
                    .userId(userId)
                    .memberRole(CommunityMemberRole.MEMBER)
                    .build());
        }
        return toCommunityResponse(community, userId);
    }

    public CommunityInvitationResponse inviteMember(
            Long communityId,
            Long ownerUserId,
            Long invitedUserId
    ) {
        Community community = getCommunity(communityId);
        ensureCommunityOwner(community, ownerUserId);

        if (ownerUserId.equals(invitedUserId)) {
            throw new IllegalArgumentException("Kendini topluluğa davet edemezsin.");
        }
        if (memberRepository.existsByCommunityIdAndUserId(communityId, invitedUserId)) {
            throw new IllegalStateException("Bu kullanıcı zaten topluluk üyesi.");
        }

        CommunityInvitation invitation = invitationRepository
                .findByCommunityIdAndInvitedUserId(communityId, invitedUserId)
                .orElseGet(() -> CommunityInvitation.builder()
                        .communityId(communityId)
                        .inviterUserId(ownerUserId)
                        .invitedUserId(invitedUserId)
                        .build());

        invitation.setInviterUserId(ownerUserId);
        invitation.setStatus(CommunityInvitationStatus.PENDING);
        invitation.setRespondedAt(null);
        return toInvitationResponse(invitationRepository.save(invitation), community);
    }

    @Transactional(readOnly = true)
    public List<CommunityInvitationResponse> getMyInvitations(Long userId) {
        return invitationRepository
                .findByInvitedUserIdAndStatusOrderByCreatedAtDesc(
                        userId,
                        CommunityInvitationStatus.PENDING)
                .stream()
                .map(invitation -> toInvitationResponse(
                        invitation,
                        getCommunity(invitation.getCommunityId())))
                .toList();
    }

    public CommunityResponse acceptInvitation(Long invitationId, Long userId) {
        CommunityInvitation invitation = getInvitation(invitationId);
        validateInvitationRecipient(invitation, userId);
        ensureInvitationPending(invitation);

        if (!memberRepository.existsByCommunityIdAndUserId(
                invitation.getCommunityId(),
                userId)) {
            memberRepository.save(CommunityMember.builder()
                    .communityId(invitation.getCommunityId())
                    .userId(userId)
                    .memberRole(CommunityMemberRole.MEMBER)
                    .build());
        }

        invitation.setStatus(CommunityInvitationStatus.ACCEPTED);
        invitation.setRespondedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        return toCommunityResponse(getCommunity(invitation.getCommunityId()), userId);
    }

    public void rejectInvitation(Long invitationId, Long userId) {
        CommunityInvitation invitation = getInvitation(invitationId);
        validateInvitationRecipient(invitation, userId);
        ensureInvitationPending(invitation);
        invitation.setStatus(CommunityInvitationStatus.REJECTED);
        invitation.setRespondedAt(LocalDateTime.now());
        invitationRepository.save(invitation);
    }

    public void leaveCommunity(Long communityId, Long userId) {
        Community community = getCommunity(communityId);
        if (community.getOwnerUserId().equals(userId)) {
            throw new IllegalStateException("Topluluk sahibi topluluktan ayrılamaz.");
        }
        memberRepository.deleteByCommunityIdAndUserId(communityId, userId);
    }

    public void removeMember(Long communityId, Long ownerUserId, Long memberUserId) {
        Community community = getCommunity(communityId);
        ensureCommunityOwner(community, ownerUserId);

        if (community.getOwnerUserId().equals(memberUserId)) {
            throw new IllegalStateException("Topluluk sahibi üyelikten çıkarılamaz.");
        }
        if (!memberRepository.existsByCommunityIdAndUserId(communityId, memberUserId)) {
            throw new IllegalArgumentException("Topluluk üyesi bulunamadı.");
        }

        for (CommunityEvent event : eventRepository.findByCommunityId(communityId)) {
            participantRepository.deleteByEventIdAndUserId(event.getId(), memberUserId);
        }
        memberRepository.deleteByCommunityIdAndUserId(communityId, memberUserId);
    }

    public CommunityResponse transferOwnership(
            Long communityId,
            Long ownerUserId,
            Long newOwnerUserId
    ) {
        Community community = getCommunity(communityId);
        ensureCommunityOwner(community, ownerUserId);

        if (ownerUserId.equals(newOwnerUserId)) {
            throw new IllegalArgumentException("Zaten topluluk sahibisin.");
        }

        CommunityMember currentOwner = memberRepository
                .findByCommunityIdAndUserId(communityId, ownerUserId)
                .orElseThrow(() -> new IllegalStateException("Mevcut sahip üyeliği bulunamadı."));
        CommunityMember newOwner = memberRepository
                .findByCommunityIdAndUserId(communityId, newOwnerUserId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Sahiplik yalnızca mevcut bir üyeye devredilebilir."));

        currentOwner.setMemberRole(CommunityMemberRole.MEMBER);
        newOwner.setMemberRole(CommunityMemberRole.OWNER);
        memberRepository.save(currentOwner);
        memberRepository.save(newOwner);

        community.setOwnerUserId(newOwnerUserId);
        Community saved = communityRepository.save(community);

        for (CommunityEvent event : eventRepository.findByCommunityId(communityId)) {
            if (event.getOrganizerUserId().equals(ownerUserId)) {
                event.setOrganizerUserId(newOwnerUserId);
                eventRepository.save(event);
            }
        }

        return toCommunityResponse(saved, ownerUserId);
    }

    public void deleteCommunity(Long communityId, Long ownerUserId) {
        Community community = getCommunity(communityId);
        ensureCommunityOwner(community, ownerUserId);

        for (Post post : postRepository.findByCommunityId(communityId)) {
            post.setIsDeleted(true);
            post.setCommunityId(null);
            mediaStorageService.deleteMediaByPostId(post.getId());
            postRepository.save(post);
        }

        for (CommunityEvent event : eventRepository.findByCommunityId(communityId)) {
            mediaStorageService.deleteMediaByCommunityEventId(event.getId());
            participantRepository.deleteByEventId(event.getId());
            eventRepository.delete(event);
        }

        invitationRepository.deleteByCommunityId(communityId);
        memberRepository.deleteByCommunityId(communityId);
        mediaStorageService.deleteMediaByCommunityId(communityId);
        communityRepository.delete(community);
    }

    public CommunityEventResponse createEvent(
            Long communityId,
            Long userId,
            CommunityEventCreateRequest request
    ) {
        Community community = getCommunity(communityId);
        if (!community.getOwnerUserId().equals(userId)) {
            throw new IllegalStateException("Etkinliği yalnızca topluluk sahibi oluşturabilir.");
        }
        if (request.getEndsAt() != null && !request.getEndsAt().isAfter(request.getStartsAt())) {
            throw new IllegalArgumentException("Etkinlik bitiş zamanı başlangıçtan sonra olmalıdır.");
        }

        CommunityEvent saved = eventRepository.save(CommunityEvent.builder()
                .communityId(communityId)
                .organizerUserId(userId)
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .eventType(request.getEventType())
                .status(CommunityEventStatus.UPCOMING)
                .location(trimToNull(request.getLocation()))
                .imageUrl(trimToNull(request.getImageUrl()))
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .capacity(request.getCapacity())
                .build());

        participantRepository.save(CommunityEventParticipant.builder()
                .eventId(saved.getId())
                .userId(userId)
                .build());
        mediaStorageService.attachMediaToCommunityEvent(saved.getImageUrl(), userId, saved.getId());
        return toEventResponse(saved, community, userId);
    }

    public CommunityEventResponse updateEvent(
            Long eventId,
            Long userId,
            CommunityEventUpdateRequest request
    ) {
        CommunityEvent event = getEvent(eventId);
        validateEventManager(event, userId);
        ensureEventIsUpcoming(event);
        validateEventTimes(request.getStartsAt(), request.getEndsAt());

        long participantCount = participantRepository.countByEventId(eventId);
        if (request.getCapacity() != null && request.getCapacity() < participantCount) {
            throw new IllegalStateException(
                    "Kapasite mevcut katılımcı sayısından düşük olamaz.");
        }

        String previousImageUrl = event.getImageUrl();
        String nextImageUrl = trimToNull(request.getImageUrl());

        event.setTitle(request.getTitle().trim());
        event.setDescription(request.getDescription().trim());
        event.setEventType(request.getEventType());
        event.setLocation(trimToNull(request.getLocation()));
        event.setImageUrl(nextImageUrl);
        event.setStartsAt(request.getStartsAt());
        event.setEndsAt(request.getEndsAt());
        event.setCapacity(request.getCapacity());

        CommunityEvent saved = eventRepository.save(event);

        if (!java.util.Objects.equals(previousImageUrl, nextImageUrl)) {
            mediaStorageService.attachMediaToCommunityEvent(nextImageUrl, userId, eventId);
            mediaStorageService.deleteMediaByUrl(previousImageUrl);
        }

        return toEventResponse(saved, getCommunity(saved.getCommunityId()), userId);
    }

    public CommunityEventResponse cancelEvent(Long eventId, Long userId) {
        CommunityEvent event = getEvent(eventId);
        validateEventManager(event, userId);
        ensureEventIsUpcoming(event);
        event.setStatus(CommunityEventStatus.CANCELLED);

        CommunityEvent saved = eventRepository.save(event);
        return toEventResponse(saved, getCommunity(saved.getCommunityId()), userId);
    }

    public void deleteEvent(Long eventId, Long userId) {
        CommunityEvent event = getEvent(eventId);
        validateEventManager(event, userId);

        mediaStorageService.deleteMediaByCommunityEventId(eventId);
        participantRepository.deleteByEventId(eventId);
        eventRepository.delete(event);
    }

    @Transactional(readOnly = true)
    public List<CommunityEventResponse> getUpcomingEvents(Long userId, int page, int size) {
        return eventRepository.findByStatusAndStartsAtAfter(
                        CommunityEventStatus.UPCOMING,
                        LocalDateTime.now(),
                        PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "startsAt")))
                .stream()
                .filter(event -> canViewCommunity(event.getCommunityId(), userId))
                .map(event -> toEventResponse(event, getCommunity(event.getCommunityId()), userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CommunityEventResponse> getCommunityEvents(
            Long communityId,
            Long userId,
            int page,
            int size
    ) {
        Community community = getCommunity(communityId);
        ensureCanViewCommunity(community, userId);
        return eventRepository.findByCommunityId(
                        communityId,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "startsAt")))
                .stream()
                .map(event -> toEventResponse(event, community, userId))
                .toList();
    }

    public CommunityEventResponse joinEvent(Long eventId, Long userId) {
        CommunityEvent event = getEvent(eventId);
        if (!CommunityEventStatus.UPCOMING.equals(event.getStatus())
                || event.getStartsAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Bu etkinliğe artık katılamazsın.");
        }
        if (!memberRepository.existsByCommunityIdAndUserId(event.getCommunityId(), userId)) {
            throw new IllegalStateException("Etkinliğe katılmak için önce topluluğa katılmalısın.");
        }
        long participantCount = participantRepository.countByEventId(eventId);
        if (event.getCapacity() != null && participantCount >= event.getCapacity()) {
            throw new IllegalStateException("Etkinlik kapasitesi dolu.");
        }
        if (!participantRepository.existsByEventIdAndUserId(eventId, userId)) {
            participantRepository.save(CommunityEventParticipant.builder()
                    .eventId(eventId)
                    .userId(userId)
                    .build());
        }
        return toEventResponse(event, getCommunity(event.getCommunityId()), userId);
    }

    public void leaveEvent(Long eventId, Long userId) {
        CommunityEvent event = getEvent(eventId);
        if (event.getOrganizerUserId().equals(userId)) {
            throw new IllegalStateException("Etkinlik düzenleyicisi katılımdan ayrılamaz.");
        }
        participantRepository.deleteByEventIdAndUserId(eventId, userId);
    }

    private void validateEventManager(CommunityEvent event, Long userId) {
        Community community = getCommunity(event.getCommunityId());
        if (!event.getOrganizerUserId().equals(userId)
                && !community.getOwnerUserId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bu etkinliği yönetme yetkin yok.");
        }
    }

    private void ensureEventIsUpcoming(CommunityEvent event) {
        if (!CommunityEventStatus.UPCOMING.equals(event.getStatus())) {
            throw new IllegalStateException("Yalnızca yaklaşan etkinlikler güncellenebilir.");
        }
    }

    private void validateEventTimes(LocalDateTime startsAt, LocalDateTime endsAt) {
        if (endsAt != null && !endsAt.isAfter(startsAt)) {
            throw new IllegalArgumentException(
                    "Etkinlik bitiş zamanı başlangıçtan sonra olmalıdır.");
        }
    }

    private Community getCommunity(Long id) {
        return communityRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Topluluk bulunamadı."));
    }

    private CommunityEvent getEvent(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Etkinlik bulunamadı."));
    }

    private CommunityInvitation getInvitation(Long id) {
        return invitationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Topluluk daveti bulunamadı."));
    }

    private void ensureCommunityOwner(Community community, Long userId) {
        if (!community.getOwnerUserId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bu işlem yalnızca topluluk sahibi tarafından yapılabilir.");
        }
    }

    private void validateInvitationRecipient(
            CommunityInvitation invitation,
            Long userId
    ) {
        if (!invitation.getInvitedUserId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bu davet sana ait değil.");
        }
    }

    private void ensureInvitationPending(CommunityInvitation invitation) {
        if (!CommunityInvitationStatus.PENDING.equals(invitation.getStatus())) {
            throw new IllegalStateException("Bu davet daha önce yanıtlanmış.");
        }
    }

    private boolean canViewCommunity(Long communityId, Long userId) {
        Community community = getCommunity(communityId);
        return CommunityVisibility.PUBLIC.equals(community.getVisibility())
                || userId != null
                && memberRepository.existsByCommunityIdAndUserId(communityId, userId);
    }

    private void ensureCanViewCommunity(Community community, Long userId) {
        if (CommunityVisibility.PRIVATE.equals(community.getVisibility())
                && (userId == null
                || !memberRepository.existsByCommunityIdAndUserId(community.getId(), userId))) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Bu topluluğun etkinliklerini görme yetkin yok.");
        }
    }

    private CommunityResponse toCommunityResponse(Community community, Long userId) {
        return CommunityResponse.builder()
                .id(community.getId())
                .ownerUserId(community.getOwnerUserId())
                .name(community.getName())
                .description(community.getDescription())
                .category(community.getCategory())
                .imageUrl(community.getImageUrl())
                .visibility(community.getVisibility())
                .membersVisible(Boolean.TRUE.equals(community.getMembersVisible()))
                .memberCount(memberRepository.countByCommunityId(community.getId()))
                .joinedByCurrentUser(userId != null
                        && memberRepository.existsByCommunityIdAndUserId(community.getId(), userId))
                .ownedByCurrentUser(userId != null && community.getOwnerUserId().equals(userId))
                .createdAt(community.getCreatedAt())
                .build();
    }

    private CommunityEventResponse toEventResponse(
            CommunityEvent event,
            Community community,
            Long userId
    ) {
        return CommunityEventResponse.builder()
                .id(event.getId())
                .communityId(event.getCommunityId())
                .communityName(community.getName())
                .organizerUserId(event.getOrganizerUserId())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventType(event.getEventType())
                .status(event.getStatus())
                .location(event.getLocation())
                .imageUrl(event.getImageUrl())
                .startsAt(event.getStartsAt())
                .endsAt(event.getEndsAt())
                .capacity(event.getCapacity())
                .participantCount(participantRepository.countByEventId(event.getId()))
                .joinedByCurrentUser(userId != null
                        && participantRepository.existsByEventIdAndUserId(event.getId(), userId))
                .createdAt(event.getCreatedAt())
                .build();
    }

    private CommunityInvitationResponse toInvitationResponse(
            CommunityInvitation invitation,
            Community community
    ) {
        return CommunityInvitationResponse.builder()
                .id(invitation.getId())
                .communityId(invitation.getCommunityId())
                .communityName(community.getName())
                .inviterUserId(invitation.getInviterUserId())
                .invitedUserId(invitation.getInvitedUserId())
                .status(invitation.getStatus())
                .createdAt(invitation.getCreatedAt())
                .build();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
