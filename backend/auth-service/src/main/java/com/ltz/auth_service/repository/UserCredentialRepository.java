package com.ltz.auth_service.repository;

import com.ltz.auth_service.entity.UserCredential;
import com.ltz.auth_service.entity.enums.AccountStatus;
import com.ltz.auth_service.entity.enums.AuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserCredentialRepository extends JpaRepository<UserCredential, Long> {

    /*
     * OAuth (STEAM) kullanıcısını sağlayıcı ve sağlayıcı kimliğine göre getirir.
     * OAuth giriş akışında kullanıcı bul/oluştur için kullanılır.
     */
    Optional<UserCredential> findByProviderAndProviderId(AuthProvider provider, String providerId);

    /*
     * E-posta adresine göre kullanıcı giriş bilgisini getirir.
     *
     * Login işleminde email ile giriş için kullanacağız.
     */
    Optional<UserCredential> findByEmail(String email);

    /*
     * Kullanıcı adına göre kullanıcı giriş bilgisini getirir.
     *
     * İleride username ile login eklemek istersek kullanabiliriz.
     */
    Optional<UserCredential> findByUsername(String username);

    /*
     * E-posta veya kullanıcı adına göre kullanıcı getirir.
     *
     * Login ekranında kullanıcı email ya da username girebilsin istersek kullanılır.
     */
    Optional<UserCredential> findByEmailOrUsername(String email, String username);

    /*
     * Register sırasında e-posta daha önce kullanılmış mı kontrol eder.
     */
    boolean existsByEmail(String email);

    /*
     * Register sırasında kullanıcı adı daha önce kullanılmış mı kontrol eder.
     */
    boolean existsByUsername(String username);

    /*
     * Belirli hesap durumuna göre kullanıcıları listelemek istersek kullanılır.
     *
     * Örnek:
     * ACTIVE, BANNED, LOCKED
     */
    boolean existsByEmailAndAccountStatus(String email, AccountStatus accountStatus);
}
