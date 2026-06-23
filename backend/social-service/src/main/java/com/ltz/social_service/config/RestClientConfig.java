package com.ltz.social_service.config;

import com.ltz.social_service.config.properties.GameServiceClientProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(GameServiceClientProperties.class)
public class RestClientConfig {

    @Bean
    public RestClient gameServiceRestClient(
            GameServiceClientProperties properties
    ) {
        java.net.http.HttpClient httpClient =
                java.net.http.HttpClient.newBuilder()
                        .connectTimeout(properties.connectTimeout())
                        .build();
        JdkClientHttpRequestFactory requestFactory =
                new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.readTimeout());

        return RestClient.builder()
                .baseUrl(properties.url())
                .requestFactory(requestFactory)
                .defaultHeader("Accept", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }
}
