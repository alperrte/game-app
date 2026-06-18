package com.ltz.auth_service.controller;

import com.ltz.auth_service.dto.response.UserInfoResponse;
import com.ltz.auth_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalUserController {

    private final AuthService authService;

    /*
     * Dahili servisler için userId'ye göre kullanıcı bilgisi döner.
     *
     * Endpoint:
     * GET /internal/users/{userId}
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserInfoResponse> getUserById(@PathVariable Long userId) {
        UserInfoResponse response = authService.getUserById(userId);

        return ResponseEntity.ok(response);
    }
}
