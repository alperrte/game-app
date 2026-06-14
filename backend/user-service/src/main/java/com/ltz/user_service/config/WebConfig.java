package com.ltz.user_service.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * 🌐 WebConfig
 * 
 * Sunucu yerel diskindeki 'uploads/' klasörünü web üzerinden erişilebilir kılmak için
 * Spring MVC statik kaynak yönlendirmelerini (Static Resource Mapping) yapılandırır.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadsPath = new File("uploads").getAbsolutePath();
        
        // '/api/users/uploads/**' gelen istekleri doğrudan 'uploads/' klasörüne yönlendirir.
        registry.addResourceHandler("/api/users/uploads/**")
                .addResourceLocations("file:" + uploadsPath + "/");
    }
}
