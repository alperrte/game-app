package com.ltz.user_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class RestClientConfig {

    @Value("${auth.service.url}")
    private String authServiceUrl;

    @Value("${review.service.url}")
    private String reviewServiceUrl;

    @Value("${social.service.url}")
    private String socialServiceUrl;

    @Value("${internal.secret}")
    private String internalSecret;

    @Bean
    public RestClient authServiceRestClient() {
        return RestClient.builder()
                .baseUrl(authServiceUrl)
                .defaultHeader("X-Internal-Secret", internalSecret)
                .build();
    }

    @Bean
    public RestClient reviewServiceRestClient() {
        return RestClient.builder()
                .baseUrl(reviewServiceUrl)
                .defaultHeader("X-Internal-Secret", internalSecret)
                .build();
    }

    @Bean
    public RestClient socialServiceRestClient() {
        return RestClient.builder()
                .baseUrl(socialServiceUrl)
                .defaultHeader("X-Internal-Secret", internalSecret)
                .build();
    }
}
