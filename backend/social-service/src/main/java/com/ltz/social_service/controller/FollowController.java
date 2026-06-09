package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.FollowCreateRequest;
import com.ltz.social_service.dto.response.FollowResponse;
import com.ltz.social_service.service.FollowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/follows")
    @ResponseStatus(HttpStatus.CREATED)
    public FollowResponse followUser(
            @Valid @RequestBody FollowCreateRequest request
    ) {
        return followService.followUser(request);
    }

    @DeleteMapping("/follows")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollowUser(
            @RequestParam Long followerUserId,
            @RequestParam Long followingUserId
    ) {
        followService.unfollowUser(followerUserId, followingUserId);
    }

    @GetMapping("/users/{userId}/following")
    public List<FollowResponse> getFollowing(
            @PathVariable Long userId
    ) {
        return followService.getFollowing(userId);
    }

    @GetMapping("/users/{userId}/followers")
    public List<FollowResponse> getFollowers(
            @PathVariable Long userId
    ) {
        return followService.getFollowers(userId);
    }
}