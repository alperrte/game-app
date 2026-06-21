package com.ltz.game_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final ExternalApiRateLimitInterceptor externalApiRateLimitInterceptor;

    public WebConfig(ExternalApiRateLimitInterceptor externalApiRateLimitInterceptor) {
        this.externalApiRateLimitInterceptor = externalApiRateLimitInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(externalApiRateLimitInterceptor)
                .addPathPatterns("/api/games/external/**");
    }
}