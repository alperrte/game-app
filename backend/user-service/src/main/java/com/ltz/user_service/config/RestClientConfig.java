package com.ltz.user_service.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

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
        return serviceClient(authServiceUrl);
    }

    @Bean
    public RestClient reviewServiceRestClient() {
        return serviceClient(reviewServiceUrl);
    }

    @Bean
    public RestClient socialServiceRestClient() {
        return serviceClient(socialServiceUrl);
    }

    private RestClient serviceClient(String baseUrl) {
        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-Internal-Secret", internalSecret)
                .defaultRequest(request -> {
                    var attributes = RequestContextHolder.getRequestAttributes();
                    if (attributes instanceof ServletRequestAttributes servletAttributes) {
                        String authorization = servletAttributes.getRequest()
                                .getHeader(HttpHeaders.AUTHORIZATION);
                        if (authorization != null && !authorization.isBlank()) {
                            request.header(HttpHeaders.AUTHORIZATION, authorization);
                        }
                    }
                })
                .build();
    }
}
