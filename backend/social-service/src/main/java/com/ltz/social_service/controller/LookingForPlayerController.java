package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.LookingForPlayerPostCreateRequest;
import com.ltz.social_service.dto.response.LookingForPlayerPostResponse;
import com.ltz.social_service.security.JwtUserPrincipal;
import com.ltz.social_service.service.LookingForPlayerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
public class LookingForPlayerController {

    private final LookingForPlayerService lookingForPlayerService;

    @PostMapping("/looking-for-player")
    @ResponseStatus(HttpStatus.CREATED)
    public LookingForPlayerPostResponse createPost(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody LookingForPlayerPostCreateRequest request
    ) {
        request.setUserId(principal.userId());
        return lookingForPlayerService.createPost(request);
    }

    @GetMapping("/looking-for-player/open")
    public List<LookingForPlayerPostResponse> getOpenPosts() {
        return lookingForPlayerService.getOpenPosts();
    }

    @GetMapping("/users/{userId}/looking-for-player")
    public List<LookingForPlayerPostResponse> getPostsByUser(@PathVariable Long userId) {
        return lookingForPlayerService.getPostsByUser(userId);
    }

    @GetMapping("/games/{gameId}/looking-for-player/open")
    public List<LookingForPlayerPostResponse> getOpenPostsByGame(@PathVariable Long gameId) {
        return lookingForPlayerService.getOpenPostsByGame(gameId);
    }

    @PutMapping("/looking-for-player/{postId}/close")
    public LookingForPlayerPostResponse closePost(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long postId
    ) {
        return lookingForPlayerService.closePost(postId, principal.userId());
    }

    @PutMapping("/looking-for-player/{postId}/cancel")
    public LookingForPlayerPostResponse cancelPost(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long postId
    ) {
        return lookingForPlayerService.cancelPost(postId, principal.userId());
    }
}
