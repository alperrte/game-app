package com.ltz.user_service.client;

import com.ltz.user_service.dto.client.response.UserInfoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/*
 * Kullanıcıları user-service için çekmek amacıyla kullanılmaktadır.
 */
@Component
@RequiredArgsConstructor
public class AuthServiceClient {

    private final RestClient authServiceRestClient;

    /*
     * userId'ye göre auth-service'ten kullanıcı bilgisi çeker.
     */
    public UserInfoResponse getUserById(Long userId) {
        return authServiceRestClient.get()
                .uri("/internal/users/{userId}", userId)
                .retrieve()
                .body(UserInfoResponse.class);
    }
}
