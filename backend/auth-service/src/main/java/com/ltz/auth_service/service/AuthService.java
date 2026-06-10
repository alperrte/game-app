package com.ltz.auth_service.service;

import com.ltz.auth_service.dto.request.LoginRequest;
import com.ltz.auth_service.dto.request.RefreshTokenRequest;
import com.ltz.auth_service.dto.request.RegisterRequest;
import com.ltz.auth_service.dto.response.AuthResponse;
import com.ltz.auth_service.dto.response.MessageResponse;
import com.ltz.auth_service.dto.response.TokenValidationResponse;
import com.ltz.auth_service.entity.RefreshToken;
import com.ltz.auth_service.entity.Role;
import com.ltz.auth_service.entity.UserCredential;
import com.ltz.auth_service.entity.enums.AccountStatus;
import com.ltz.auth_service.exception.*;
import com.ltz.auth_service.repository.RefreshTokenRepository;
import com.ltz.auth_service.repository.RoleRepository;
import com.ltz.auth_service.repository.UserCredentialRepository;
import com.ltz.auth_service.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserCredentialRepository userCredentialRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${jwt.refresh-token-expiration}")
    private Long refreshTokenExpiration;

    /*
     * Yeni kullanıcı kaydı oluşturur.
     */
    public AuthResponse register(RegisterRequest request) {

        if (userCredentialRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Bu e-posta adresi zaten kullanılıyor.");
        }

        if (userCredentialRepository.existsByUsername(request.getUsername())) {
            throw new UsernameAlreadyExistsException("Bu kullanıcı adı zaten kullanılıyor.");
        }

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RoleNotFoundException("Varsayılan USER rolü bulunamadı."));

        UserCredential userCredential = UserCredential.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(false)
                .build();

        UserCredential savedUser = userCredentialRepository.save(userCredential);

        String accessToken = jwtService.generateAccessToken(savedUser);
        RefreshToken refreshToken = createRefreshToken(savedUser);

        return buildAuthResponse(savedUser, accessToken, refreshToken.getToken());
    }

    /*
     * Kullanıcı girişi yapar.
     *
     * identifier alanı email veya username olabilir.
     */
    public AuthResponse login(LoginRequest request) {

        UserCredential userCredential = userCredentialRepository
                .findByEmailOrUsername(request.getIdentifier(), request.getIdentifier())
                .orElseThrow(() -> new InvalidCredentialsException("E-posta/kullanıcı adı veya şifre hatalı."));

        validateAccountStatus(userCredential);

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                userCredential.getPasswordHash()
        );

        if (!passwordMatches) {
            throw new InvalidCredentialsException("E-posta/kullanıcı adı veya şifre hatalı.");
        }

        userCredential.setLastLoginAt(LocalDateTime.now());
        userCredentialRepository.save(userCredential);

        String accessToken = jwtService.generateAccessToken(userCredential);
        RefreshToken refreshToken = createRefreshToken(userCredential);

        return buildAuthResponse(userCredential, accessToken, refreshToken.getToken());
    }

    /*
     * Refresh token ile yeni access token üretir.
     */
    public AuthResponse refreshToken(RefreshTokenRequest request) {

        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new InvalidTokenException("Refresh token geçersiz."));

        if (refreshToken.getRevoked()) {
            throw new InvalidTokenException("Refresh token iptal edilmiş.");
        }

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);

            throw new RefreshTokenExpiredException("Refresh token süresi dolmuş.");
        }

        UserCredential userCredential = refreshToken.getUser();

        validateAccountStatus(userCredential);

        String newAccessToken = jwtService.generateAccessToken(userCredential);

        return buildAuthResponse(userCredential, newAccessToken, refreshToken.getToken());
    }

    /*
     * Kullanıcının refresh token değerini iptal eder.
     * Logout işleminde kullanılır.
     */
    public MessageResponse logout(RefreshTokenRequest request) {

        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new InvalidTokenException("Refresh token geçersiz."));

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return MessageResponse.builder()
                .message("Çıkış işlemi başarılı.")
                .build();
    }

    /*
     * Access token geçerli mi kontrol eder.
     *
     * API Gateway veya diğer servisler bu endpoint'i kullanabilir.
     */
    public TokenValidationResponse validateToken(String token) {

        try {
            String email = jwtService.extractEmail(token);

            UserCredential userCredential = userCredentialRepository.findByEmail(email)
                    .orElseThrow(() -> new UserNotFoundException("Token içindeki kullanıcı bulunamadı."));

            boolean valid = jwtService.isTokenValid(token, userCredential);

            if (!valid) {
                return TokenValidationResponse.builder()
                        .valid(false)
                        .message("Token geçersiz veya süresi dolmuş.")
                        .build();
            }

            validateAccountStatus(userCredential);

            return TokenValidationResponse.builder()
                    .valid(true)
                    .userId(userCredential.getId())
                    .email(userCredential.getEmail())
                    .username(userCredential.getUsername())
                    .role(userCredential.getRole().getName())
                    .message("Token geçerli.")
                    .build();

        } catch (Exception exception) {
            return TokenValidationResponse.builder()
                    .valid(false)
                    .message("Token geçersiz.")
                    .build();
        }
    }

    /*
     * Refresh token oluşturur ve database'e kaydeder.
     */
    private RefreshToken createRefreshToken(UserCredential userCredential) {

        RefreshToken refreshToken = RefreshToken.builder()
                .user(userCredential)
                .token(UUID.randomUUID().toString())
                .revoked(false)
                .expiresAt(LocalDateTime.now().plusNanos(refreshTokenExpiration * 1_000_000))
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    /*
     * AuthResponse ortak dönüş formatı.
     */
    private AuthResponse buildAuthResponse(
            UserCredential userCredential,
            String accessToken,
            String refreshToken
    ) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(userCredential.getId())
                .email(userCredential.getEmail())
                .username(userCredential.getUsername())
                .role(userCredential.getRole().getName())
                .build();
    }

    /*
     * Kullanıcının hesap durumunu kontrol eder.
     */
    private void validateAccountStatus(UserCredential userCredential) {

        if (userCredential.getAccountStatus() == AccountStatus.ACTIVE) {
            return;
        }

        if (userCredential.getAccountStatus() == AccountStatus.BANNED) {
            throw new AccountNotActiveException("Bu hesap banlanmıştır.");
        }

        if (userCredential.getAccountStatus() == AccountStatus.LOCKED) {
            throw new AccountNotActiveException("Bu hesap geçici olarak kilitlenmiştir.");
        }

        if (userCredential.getAccountStatus() == AccountStatus.INACTIVE) {
            throw new AccountNotActiveException("Bu hesap aktif değildir.");
        }

        if (userCredential.getAccountStatus() == AccountStatus.DELETED) {
            throw new AccountNotActiveException("Bu hesap silinmiştir.");
        }

        throw new AccountNotActiveException("Bu hesap aktif değildir.");
    }
}