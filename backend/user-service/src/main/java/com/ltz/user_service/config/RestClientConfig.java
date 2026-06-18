package com.ltz.user_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Value("${auth.service.url}")
    private String authServiceUrl;

    @Value("${internal.secret}")
    private String internalSecret;

    /*
     * auth-service ile iletişim kurmak için kullanılan RestClient.
     * X-Internal-Secret header'ı her istekte otomatik eklenir;
     * auth-service'teki InternalSecretFilter bu değeri doğrular.
     */
    @Bean
    public RestClient authServiceRestClient() {
        return RestClient.builder()
                .baseUrl(authServiceUrl)
                .defaultHeader("X-Internal-Secret", internalSecret)
                .build();
    }
}
