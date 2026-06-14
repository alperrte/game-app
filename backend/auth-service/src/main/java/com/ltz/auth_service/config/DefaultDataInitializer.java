package com.ltz.auth_service.config;

import com.ltz.auth_service.entity.Role;
import com.ltz.auth_service.entity.UserCredential;
import com.ltz.auth_service.entity.enums.AccountStatus;
import com.ltz.auth_service.entity.enums.AuthProvider;
import com.ltz.auth_service.repository.RoleRepository;
import com.ltz.auth_service.repository.UserCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

/*
 * Uygulama açılışında çalışan başlatıcı.
 *
 * 1) Rol garantisi: gerekli rollerin (USER, ADMIN, MODERATOR, DEVELOPER, CONTENT_CREATOR)
 *    var olduğundan emin olur. (Flyway V4 zaten ekliyor; burada eksikler tamamlanır.)
 *
 * 2) Varsayılan kullanıcılar: her rol için .env'den gelen e-posta ve ortak şifre ile
 *    birer kullanıcı oluşturur. Var olan e-postalar atlanır (idempotent, şifre ezilmez).
 *
 * DİKKAT: Bu seed yalnızca GELİŞTİRME/TEST içindir. Sabit e-postalar ve "123456" şifresi
 * güvenli değildir; canlı ortamda DEFAULT_USERS_ENABLED=false ile kapatılmalıdır.
 */
@Component
@RequiredArgsConstructor
public class DefaultDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DefaultDataInitializer.class);

    private static final List<String> DEFAULT_ROLES = List.of(
            "USER", "ADMIN", "MODERATOR", "DEVELOPER", "CONTENT_CREATOR"
    );

    private final RoleRepository roleRepository;
    private final UserCredentialRepository userCredentialRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.default-users.enabled:true}")
    private boolean defaultUsersEnabled;

    @Value("${app.default-users.password:123456}")
    private String defaultPassword;

    @Value("${app.default-users.user-email:user@ltz.com}")
    private String userEmail;

    @Value("${app.default-users.admin-email:admin@ltz.com}")
    private String adminEmail;

    @Value("${app.default-users.moderator-email:moderator@ltz.com}")
    private String moderatorEmail;

    @Value("${app.default-users.developer-email:developer@ltz.com}")
    private String developerEmail;

    @Value("${app.default-users.content-creator-email:contentcreator@ltz.com}")
    private String contentCreatorEmail;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ensureRoles();

        if (!defaultUsersEnabled) {
            log.info("Varsayılan kullanıcı seed'i devre dışı (app.default-users.enabled=false).");
            return;
        }

        seedUser(userEmail, "user", "USER");
        seedUser(adminEmail, "admin", "ADMIN");
        seedUser(moderatorEmail, "moderator", "MODERATOR");
        seedUser(developerEmail, "developer", "DEVELOPER");
        seedUser(contentCreatorEmail, "contentcreator", "CONTENT_CREATOR");
    }

    /*
     * Gerekli roller yoksa oluşturur (var olanlara dokunmaz).
     */
    private void ensureRoles() {
        for (String roleName : DEFAULT_ROLES) {
            if (!roleRepository.existsByName(roleName)) {
                roleRepository.save(Role.builder().name(roleName).build());
                log.info("Rol oluşturuldu: {}", roleName);
            }
        }
    }

    /*
     * Verilen e-posta/kullanıcı adı ile rol kullanıcısını oluşturur.
     * E-posta veya kullanıcı adı zaten kullanılıyorsa atlar.
     */
    private void seedUser(String email, String username, String roleName) {

        if (!StringUtils.hasText(email)) {
            log.warn("Varsayılan {} kullanıcısı için e-posta tanımsız, atlanıyor.", roleName);
            return;
        }

        if (userCredentialRepository.existsByEmail(email)
                || userCredentialRepository.existsByUsername(username)) {
            log.debug("Varsayılan kullanıcı zaten var, atlanıyor: {}", email);
            return;
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalStateException(
                        "Seed sırasında rol bulunamadı: " + roleName));

        UserCredential user = UserCredential.builder()
                .email(email)
                .username(username)
                .passwordHash(passwordEncoder.encode(defaultPassword))
                .role(role)
                .accountStatus(AccountStatus.ACTIVE)
                .emailVerified(true)
                .provider(AuthProvider.LOCAL)
                .build();

        userCredentialRepository.save(user);
        log.info("Varsayılan kullanıcı oluşturuldu: {} ({})", email, roleName);
    }
}
