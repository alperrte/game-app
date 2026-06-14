package com.ltz.auth_service.security;

import com.ltz.auth_service.entity.UserCredential;
import com.ltz.auth_service.entity.enums.AccountStatus;
import com.ltz.auth_service.repository.UserCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerUserDetailsService implements UserDetailsService {

    private final UserCredentialRepository userCredentialRepository;

    /*
     * Spring Security login/token doğrulama sırasında kullanıcıyı bu method ile yükler.
     *
     * Biz burada username yerine email kullanıyoruz.
     * Çünkü JWT içinde subject olarak email tutuyoruz.
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        UserCredential userCredential = userCredentialRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Kullanıcı bulunamadı."));

        /*
         * Kullanıcının aktif olup olmadığını Spring Security'ye bildiriyoruz.
         *
         * ACTIVE değilse enabled=false olur.
         * Böylece kullanıcı doğrulama sürecinde aktif kabul edilmez.
         */
        boolean enabled = userCredential.getAccountStatus() == AccountStatus.ACTIVE;

        /*
         * Spring Security rol yapısında roller genelde ROLE_ prefix'i ile tutulur.
         *
         * Database'de:
         * USER
         *
         * Security tarafında:
         * ROLE_USER
         */
        /*
         * OAuth (STEAM) kullanıcılarının şifresi NULL'dır.
         * Spring Security'nin User nesnesi null şifre kabul etmediği için boş string veriyoruz.
         * Bu kullanıcılar zaten şifreyle giriş yapamaz; doğrulama JWT üzerinden yürür.
         */
        String password = userCredential.getPasswordHash() != null
                ? userCredential.getPasswordHash()
                : "";

        return new User(
                userCredential.getEmail(),
                password,
                enabled,
                true,
                true,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_" + userCredential.getRole().getName()))
        );
    }
}