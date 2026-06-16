package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.BlockUserRequest;
import com.ltz.social_service.dto.response.UserBlockResponse;
import com.ltz.social_service.security.JwtUserPrincipal;
import com.ltz.social_service.service.BlockService;
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
public class BlockController {

    private final BlockService blockService;

    @PostMapping("/blocks")
    @ResponseStatus(HttpStatus.CREATED)
    public UserBlockResponse blockUser(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @Valid @RequestBody BlockUserRequest request
    ) {
        request.setBlockerUserId(principal.userId());
        return blockService.blockUser(request);
    }

    @DeleteMapping("/blocks")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblockUser(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam Long blockedUserId
    ) {
        blockService.unblockUser(principal.userId(), blockedUserId);
    }

    @GetMapping("/users/{userId}/blocks")
    public List<UserBlockResponse> getBlockedUsers(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable Long userId
    ) {
        return blockService.getBlockedUsers(userId, principal.userId());
    }
}
