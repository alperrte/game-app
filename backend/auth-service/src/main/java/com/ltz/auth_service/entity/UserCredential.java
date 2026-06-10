package com.ltz.auth_service.entity;

import com.ltz.auth_service.entity.enums.AccountStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_credentials")
public class UserCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Kullanıcının e-posta adresi.
     * Login işleminde email ile girişe izin verebiliriz.
     */
    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    /*
     * Kullanıcının benzersiz kullanıcı adı.
     * Profil tarafında da bu username kullanılabilir.
     */
    @Column(name = "username", nullable = false, unique = true, length = 100)
    private String username;

    /*
     * Kullanıcının hashlenmiş şifresi.
     *
     * Dikkat:
     * Burada düz şifre tutulmaz.
     * Register sırasında BCrypt ile hashlenmiş değer tutulur.
     */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    /*
     * Kullanıcının rolü.
     *
     * user_credentials.role_id alanı roles.id alanına bağlıdır.
     * Örnek rol: USER, ADMIN, MODERATOR
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    /*
     * Kullanıcının hesap durumu.
     *
     * ACTIVE, INACTIVE, BANNED, LOCKED, DELETED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "account_status", nullable = false, length = 30)
    private AccountStatus accountStatus;

    /*
     * E-posta doğrulama durumu.
     *
     * Şimdilik false başlayabilir.
     * İleride mail doğrulama eklersek true yapılır.
     */
    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified;

    /*
     * Kullanıcının son başarılı giriş tarihi.
     * Login işleminde güncellenir.
     */
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /* Oluşturulma tarihi otomatik gelir.*/
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();

        if (this.accountStatus == null) {
            this.accountStatus = AccountStatus.ACTIVE;
        }

        if (this.emailVerified == null) {
            this.emailVerified = false;
        }
    }

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /* Güncellenme tarihi otomatik gelir.*/
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
