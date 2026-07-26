package com.ltz.user_service.controller;

import com.ltz.user_service.dto.request.CreateClipRequest;
import com.ltz.user_service.dto.response.UserProfileClipResponse;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.service.UserProfileClipService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserProfileClipController {

    private final UserProfileClipService clipService;

    @GetMapping("/{userId}/clips")
    public ResponseEntity<List<UserProfileClipResponse>> getClipsByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(clipService.getClipsByUserId(userId));
    }

    @PostMapping("/profile/clips")
    public ResponseEntity<UserProfileClipResponse> addClip(
            @Valid @RequestBody CreateClipRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        String authenticatedUserId = principal.userId().toString();
        UserProfileClipResponse response = clipService.addClip(authenticatedUserId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/profile/clips/{clipId}")
    public ResponseEntity<Void> deleteClip(
            @PathVariable Long clipId,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        String authenticatedUserId = principal.userId().toString();
        clipService.deleteClip(clipId, authenticatedUserId);
        return ResponseEntity.noContent().build();
    }
}
