package com.ltz.auth_service.repository;

import com.ltz.auth_service.entity.RefreshToken;
import com.ltz.auth_service.entity.UserCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /*
     * Token değerine göre refresh token kaydını getirir.
     *
     * Refresh token yenileme işleminde kullanacağız.
     */
    Optional<RefreshToken> findByToken(String token);

    /*
     * Kullanıcıya ait tüm refresh token kayıtlarını getirir.
     */
    List<RefreshToken> findByUser(UserCredential user);

    /*
     * Kullanıcıya ait aktif yani iptal edilmemiş tokenları getirir.
     */
    List<RefreshToken> findByUserAndRevokedFalse(UserCredential user);

    /*
     * Kullanıcıya ait tüm tokenları siler.
     *
     * Logout all devices gibi bir özellikte kullanılabilir.
     */
    void deleteByUser(UserCredential user);

    /*
     * Token sistemde var mı kontrol eder.
     */
    boolean existsByToken(String token);
}
