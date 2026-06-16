package com.ltz.game_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GamePlatformRequest {

    @NotBlank(message = "Platform adı boş bırakılamaz.")
    @Size(max = 100, message = "Platform adı en fazla 100 karakter olabilir.")
    private String name;

    @Size(max = 500, message = "Platform açıklaması en fazla 500 karakter olabilir.")
    private String description;

    @Size(max = 500, message = "Logo URL en fazla 500 karakter olabilir.")
    private String logoUrl;

    public GamePlatformRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }
}