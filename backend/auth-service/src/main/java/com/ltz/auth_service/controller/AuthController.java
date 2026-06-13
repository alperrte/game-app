package com.ltz.auth_service.controller;

import com.ltz.auth_service.dto.request.LoginRequest;
import com.ltz.auth_service.dto.request.RefreshTokenRequest;
import com.ltz.auth_service.dto.request.RegisterRequest;
import com.ltz.auth_service.dto.response.AuthResponse;
import com.ltz.auth_service.dto.response.MessageResponse;
import com.ltz.auth_service.dto.response.TokenValidationResponse;
import com.ltz.auth_service.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /*
     * Yeni kullanıcı kaydı oluşturur.
     *
     * Endpoint:
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        AuthResponse response = authService.register(request);

        return ResponseEntity.ok(response);
    }

    /*
     * Kullanıcı girişi yapar.
     *
     * identifier alanı email veya username olabilir.
     *
     * Endpoint:
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        AuthResponse response = authService.login(request);

        return ResponseEntity.ok(response);
    }

    /*
     * Refresh token ile yeni access token üretir.
     *
     * Endpoint:
     * POST /api/auth/refresh-token
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        AuthResponse response = authService.refreshToken(request);

        return ResponseEntity.ok(response);
    }

    /*
     * Refresh token'ı iptal eder.
     *
     * Endpoint:
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        MessageResponse response = authService.logout(request);

        return ResponseEntity.ok(response);
    }

    /*
     * Access token geçerli mi kontrol eder.
     *
     * Endpoint:
     * GET /api/auth/validate-token
     *
     * Kullanım:
     * /api/auth/validate-token?token=JWT_TOKEN
     */
    @GetMapping("/validate-token")
    public ResponseEntity<TokenValidationResponse> validateToken(
            @RequestParam String token
    ) {
        TokenValidationResponse response = authService.validateToken(token);

        return ResponseEntity.ok(response);
    }
}