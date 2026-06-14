package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.FriendRequestCreateRequest;
import com.ltz.social_service.dto.response.FriendRequestResponse;
import com.ltz.social_service.dto.response.FriendshipResponse;
import com.ltz.social_service.security.JwtUserPrincipal;
import com.ltz.social_service.service.FriendService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @PostMapping("/friend-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public FriendRequestResponse sendFriendRequest(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody FriendRequestCreateRequest request
    ) {
        request.setSenderUserId(principal.userId());
        return friendService.sendFriendRequest(request);
    }

    @PutMapping("/friend-requests/{requestId}/accept")
    public FriendRequestResponse acceptFriendRequest(@PathVariable Long requestId) {
        return friendService.acceptFriendRequest(requestId);
    }

    @PutMapping("/friend-requests/{requestId}/reject")
    public FriendRequestResponse rejectFriendRequest(@PathVariable Long requestId) {
        return friendService.rejectFriendRequest(requestId);
    }

    @PutMapping("/friend-requests/{requestId}/cancel")
    public FriendRequestResponse cancelFriendRequest(@PathVariable Long requestId) {
        return friendService.cancelFriendRequest(requestId);
    }

    @GetMapping("/users/{userId}/friend-requests/incoming")
    public List<FriendRequestResponse> getIncomingPendingRequests(@PathVariable Long userId) {
        return friendService.getIncomingPendingRequests(userId);
    }

    @GetMapping("/users/{userId}/friend-requests/outgoing")
    public List<FriendRequestResponse> getOutgoingPendingRequests(@PathVariable Long userId) {
        return friendService.getOutgoingPendingRequests(userId);
    }

    @GetMapping("/users/{userId}/friends")
    public List<FriendshipResponse> getFriends(@PathVariable Long userId) {
        return friendService.getFriends(userId);
    }

    @DeleteMapping("/users/{userId}/friends/{friendUserId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeFriend(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long friendUserId
    ) {
        friendService.removeFriend(principal.userId(), friendUserId);
    }
}
