package com.ltz.auth_service.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Refresh token'ın ait olduğu kullanıcı.
     *
     * refresh_tokens.user_id alanı user_credentials.id alanına bağlıdır.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserCredential user;

    /*
     * Refresh token değeri.
     * Benzersiz olmalıdır.
     */
    @Column(name = "token", nullable = false, unique = true, length = 500)
    private String token;

    /*
     * Token iptal edildi mi?
     *
     * Logout işleminde true yapılabilir.
     */
    @Column(name = "revoked", nullable = false)
    private Boolean revoked;

    /*
     * Refresh token bitiş tarihi.
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /* Oluşturulma tarihi otomatik gelir*/
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();

        if (this.revoked == null) {
            this.revoked = false;
        }
    }
}
