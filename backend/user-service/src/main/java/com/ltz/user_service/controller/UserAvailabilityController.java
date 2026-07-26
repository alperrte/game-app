package com.ltz.user_service.controller;

import com.ltz.user_service.dto.AvailabilitySlotDto;
import com.ltz.user_service.dto.request.UpdateAvailabilityRequest;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.service.UserAvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserAvailabilityController {

    private final UserAvailabilityService availabilityService;

    @GetMapping("/{userId}/availability")
    public ResponseEntity<List<AvailabilitySlotDto>> getAvailabilityByUserId(@PathVariable String userId) {
        return ResponseEntity.ok(availabilityService.getAvailabilityByUserId(userId));
    }

    @PutMapping("/profile/availability")
    public ResponseEntity<List<AvailabilitySlotDto>> updateAvailability(
            @Valid @RequestBody UpdateAvailabilityRequest request,
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        String authenticatedUserId = principal.userId().toString();
        List<AvailabilitySlotDto> response = availabilityService.updateAvailability(authenticatedUserId, request);
        return ResponseEntity.ok(response);
    }
}
