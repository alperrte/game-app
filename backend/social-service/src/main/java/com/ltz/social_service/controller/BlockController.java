package com.ltz.social_service.controller;

import com.ltz.social_service.dto.request.BlockUserRequest;
import com.ltz.social_service.dto.response.UserBlockResponse;
import com.ltz.social_service.service.BlockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class BlockController {

    private final BlockService blockService;

    @PostMapping("/blocks")
    @ResponseStatus(HttpStatus.CREATED)
    public UserBlockResponse blockUser(
            @Valid @RequestBody BlockUserRequest request
    ) {
        return blockService.blockUser(request);
    }

    @DeleteMapping("/blocks")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unblockUser(
            @RequestParam Long blockerUserId,
            @RequestParam Long blockedUserId
    ) {
        blockService.unblockUser(blockerUserId, blockedUserId);
    }

    @GetMapping("/users/{userId}/blocks")
    public List<UserBlockResponse> getBlockedUsers(
            @PathVariable Long userId
    ) {
        return blockService.getBlockedUsers(userId);
    }
}