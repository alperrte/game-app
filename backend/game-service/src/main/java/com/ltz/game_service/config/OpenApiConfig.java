package com.ltz.game_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI gameServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("LobbyTwoZero Game Service API")
                        .description("Game-service oyun ekleme, güncelleme, silme, listeleme, detay görüntüleme, filtreleme, popüler oyunlar, oyun kategorileri ve oyun platformları işlemlerini yönetir.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("LobbyTwoZero Team")
                                .email("support@lobbytwozero.com"))
                        .license(new License()
                                .name("All rights reserved")));
    }
}