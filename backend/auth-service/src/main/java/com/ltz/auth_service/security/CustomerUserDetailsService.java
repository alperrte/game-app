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

        return toUserDetails(userCredential);
    }

    /*
     * UserCredential -> UserDetails dönüşümünü merkezi bir yerde tutar.
     * JwtAuthenticationFilter bu metodu kullanarak gereksiz ikinci DB sorgusunu önler.
     *
     * OAuth (STEAM) kullanıcılarının şifresi NULL'dır; Spring Security boş string ister.
     * ACTIVE olmayan hesaplar enabled=false ile işaretlenir.
     */
    public UserDetails toUserDetails(UserCredential userCredential) {
        boolean enabled = userCredential.getAccountStatus() == AccountStatus.ACTIVE;

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