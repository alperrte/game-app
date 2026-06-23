package com.ltz.hardware_service.controller;

import com.ltz.hardware_service.dto.request.UserHardwareUpsertRequest;
import com.ltz.hardware_service.dto.response.MessageResponse;
import com.ltz.hardware_service.dto.response.UserHardwareResponse;
import com.ltz.hardware_service.service.UserHardwareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hardware/users/{userId}")
@RequiredArgsConstructor
public class UserHardwareController {

    private final UserHardwareService userHardwareService;

    @GetMapping
    public UserHardwareResponse getUserHardware(
            @PathVariable Long userId
    ) {
        return userHardwareService.getUserHardware(userId);
    }

    @PostMapping
    public UserHardwareResponse createOrUpdateUserHardware(
            @PathVariable Long userId,
            @Valid @RequestBody UserHardwareUpsertRequest request
    ) {
        return userHardwareService.upsertUserHardware(userId, request);
    }

    @PutMapping
    public UserHardwareResponse updateUserHardware(
            @PathVariable Long userId,
            @Valid @RequestBody UserHardwareUpsertRequest request
    ) {
        return userHardwareService.upsertUserHardware(userId, request);
    }

    @DeleteMapping
    public MessageResponse deleteUserHardware(
            @PathVariable Long userId
    ) {
        return userHardwareService.deleteUserHardware(userId);
    }
}