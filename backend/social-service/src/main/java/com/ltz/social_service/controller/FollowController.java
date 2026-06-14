package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.FollowCreateRequest;
import com.ltz.social_service.dto.response.FollowResponse;
import com.ltz.social_service.security.JwtUserPrincipal;
import com.ltz.social_service.service.FollowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/follows")
    @ResponseStatus(HttpStatus.CREATED)
    public FollowResponse followUser(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody FollowCreateRequest request
    ) {
        request.setFollowerUserId(principal.userId());
        return followService.followUser(request);
    }

    @DeleteMapping("/follows")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollowUser(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam Long followingUserId
    ) {
        followService.unfollowUser(principal.userId(), followingUserId);
    }

    @GetMapping("/users/{userId}/following")
    public List<FollowResponse> getFollowing(@PathVariable Long userId) {
        return followService.getFollowing(userId);
    }

    @GetMapping("/users/{userId}/followers")
    public List<FollowResponse> getFollowers(@PathVariable Long userId) {
        return followService.getFollowers(userId);
    }
}
