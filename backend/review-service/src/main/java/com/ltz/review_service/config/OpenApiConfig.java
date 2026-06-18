package com.ltz.review_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI reviewServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LobbyTwoZero Review Service API")
                        .description("Review, rating, like and report operations for games")
                        .version("1.0.0"));
    }
}