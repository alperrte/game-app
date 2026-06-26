package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.CommunityCreateRequest;
import com.ltz.social_service.dto.request.CommunityUpdateRequest;
import com.ltz.social_service.dto.request.CommunityEventCreateRequest;
import com.ltz.social_service.dto.request.CommunityEventUpdateRequest;
import com.ltz.social_service.dto.request.CommunityInviteRequest;
import com.ltz.social_service.dto.request.CommunityTransferOwnershipRequest;
import com.ltz.social_service.dto.response.CommunityEventResponse;
import com.ltz.social_service.dto.response.CommunityMemberResponse;
import com.ltz.social_service.dto.response.CommunityInvitationResponse;
import com.ltz.social_service.dto.response.CommunityResponse;
import com.ltz.social_service.security.JwtUserPrincipal;
import com.ltz.social_service.service.CommunityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @GetMapping("/communities")
    public List<CommunityResponse> getCommunities(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return communityService.getCommunities(
                principal.userId(),
                query,
                Math.max(0, page),
                boundedSize(size));
    }

    @GetMapping("/communities/mine")
    public List<CommunityResponse> getMyCommunities(
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return communityService.getMyCommunities(principal.userId());
    }

    @GetMapping("/communities/{communityId}")
    public CommunityResponse getCommunityById(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return communityService.getCommunityById(communityId, principal.userId());
    }

    @PostMapping("/communities")
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityResponse createCommunity(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody CommunityCreateRequest request
    ) {
        return communityService.createCommunity(principal.userId(), request);
    }

    @PutMapping("/communities/{communityId}")
    public CommunityResponse updateCommunity(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody CommunityUpdateRequest request
    ) {
        return communityService.updateCommunity(communityId, principal.userId(), request);
    }

    @GetMapping("/communities/{communityId}/members")
    public List<CommunityMemberResponse> getCommunityMembers(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return communityService.getCommunityMembers(communityId, principal.userId());
    }

    @PostMapping("/communities/{communityId}/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityInvitationResponse inviteMember(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody CommunityInviteRequest request
    ) {
        return communityService.inviteMember(
                communityId,
                principal.userId(),
                request.getUserId());
    }

    @GetMapping("/community-invitations/mine")
    public List<CommunityInvitationResponse> getMyInvitations(
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return communityService.getMyInvitations(principal.userId());
    }

    @PostMapping("/community-invitations/{invitationId}/accept")
    public CommunityResponse acceptInvitation(
            @PathVariable Long invitationId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return communityService.acceptInvitation(invitationId, principal.userId());
    }

    @PostMapping("/community-invitations/{invitationId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectInvitation(
            @PathVariable Long invitationId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        communityService.rejectInvitation(invitationId, principal.userId());
    }

    @DeleteMapping("/communities/{communityId}/members/{memberUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable Long communityId,
            @PathVariable Long memberUserId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        communityService.removeMember(communityId, principal.userId(), memberUserId);
    }

    @PutMapping("/communities/{communityId}/ownership")
    public CommunityResponse transferOwnership(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody CommunityTransferOwnershipRequest request
    ) {
        return communityService.transferOwnership(
                communityId,
                principal.userId(),
                request.getUserId());
    }

    @DeleteMapping("/communities/{communityId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCommunity(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        communityService.deleteCommunity(communityId, principal.userId());
    }

    @PostMapping("/communities/{communityId}/join")
    public CommunityResponse joinCommunity(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return communityService.joinCommunity(communityId, principal.userId());
    }

    @DeleteMapping("/communities/{communityId}/membership")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leaveCommunity(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        communityService.leaveCommunity(communityId, principal.userId());
    }

    @PostMapping("/communities/{communityId}/events")
    @ResponseStatus(HttpStatus.CREATED)
    public CommunityEventResponse createEvent(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody CommunityEventCreateRequest request
    ) {
        return communityService.createEvent(communityId, principal.userId(), request);
    }

    @PutMapping("/events/{eventId}")
    public CommunityEventResponse updateEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody CommunityEventUpdateRequest request
    ) {
        return communityService.updateEvent(eventId, principal.userId(), request);
    }

    @PutMapping("/events/{eventId}/cancel")
    public CommunityEventResponse cancelEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return communityService.cancelEvent(eventId, principal.userId());
    }

    @DeleteMapping("/events/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        communityService.deleteEvent(eventId, principal.userId());
    }

    @GetMapping("/communities/{communityId}/events")
    public List<CommunityEventResponse> getCommunityEvents(
            @PathVariable Long communityId,
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return communityService.getCommunityEvents(
                communityId,
                principal.userId(),
                Math.max(0, page),
                boundedSize(size));
    }

    @GetMapping("/events/upcoming")
    public List<CommunityEventResponse> getUpcomingEvents(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return communityService.getUpcomingEvents(
                principal.userId(),
                Math.max(0, page),
                boundedSize(size));
    }

    @PostMapping("/events/{eventId}/join")
    public CommunityEventResponse joinEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        return communityService.joinEvent(eventId, principal.userId());
    }

    @DeleteMapping("/events/{eventId}/participation")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leaveEvent(
            @PathVariable Long eventId,
            @AuthenticationPrincipal JwtUserPrincipal principal
    ) {
        communityService.leaveEvent(eventId, principal.userId());
    }

    private int boundedSize(int size) {
        return Math.max(1, Math.min(size, 100));
    }
}
