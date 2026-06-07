package com.ltz.auth_service.controller;

import com.ltz.auth_service.dto.AuthResponse;
import com.ltz.auth_service.dto.LoginRequest;
import com.ltz.auth_service.dto.RegisterRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("auth-service is running");
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {

        AuthResponse response = new AuthResponse(
                "dummy-access-token-for-" + request.getEmail(),
                "dummy-refresh-token",
                "Bearer",
                "User registered successfully"
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {

        AuthResponse response = new AuthResponse(
                "dummy-access-token-for-" + request.getEmail(),
                "dummy-refresh-token",
                "Bearer",
                "Login successful"
        );

        return ResponseEntity.ok(response);
    }
}