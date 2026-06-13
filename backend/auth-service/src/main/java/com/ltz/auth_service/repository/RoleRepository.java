package com.ltz.auth_service.repository;

import com.ltz.auth_service.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    /*
     * Rol adına göre role kaydını getirir.
     *
     * Örnek:
     * USER
     * ADMIN
     * MODERATOR
     * DEVELOPER
     * CONTENT_CREATOR
     */
    Optional<Role> findByName(String name);

    /*
     * Verilen rol adı sistemde var mı kontrol eder.
     */
    boolean existsByName(String name);
}
