package com.ltz.social_service.config.properties;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "game.service")
public record GameServiceClientProperties(
        @NotBlank String url,
        @NotNull Duration connectTimeout,
        @NotNull Duration readTimeout,
        @NotBlank String gamesPath,
        @NotBlank String platformsPath,
        @NotBlank String externalAppsPath,
        @NotBlank String externalSource,
        @Positive int externalPage,
        @Positive int externalSize,
        @NotBlank String fallbackPlatform
) {
}
