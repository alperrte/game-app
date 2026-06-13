package com.ltz.auth_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    /*
     * Swagger / OpenAPI ayarları.
     *
     * Bu sade config test için kullanılır.
     * JWT Authorize butonu eklemez.
     */
    @Bean
    public OpenAPI authServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LobbyTwoZero Auth Service API")
                        .description("LTZ Auth Service - Register, Login, Refresh Token, Logout and Token Validation APIs")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("LobbyTwoZero")
                                .email("support@lobbytwozero.com"))
                        .license(new License()
                                .name("All Rights Reserved")));
    }
}