package com.ltz.game_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class PublisherRequest {

    @NotBlank(message = "Yayıncı adı boş bırakılamaz.")
    @Size(max = 150, message = "Yayıncı adı en fazla 150 karakter olabilir.")
    private String name;

    @Size(max = 1000, message = "Yayıncı açıklaması en fazla 1000 karakter olabilir.")
    private String description;

    @Size(max = 500, message = "Website URL bilgisi en fazla 500 karakter olabilir.")
    private String websiteUrl;

    @Size(max = 100, message = "Ülke bilgisi en fazla 100 karakter olabilir.")
    private String country;

    public PublisherRequest() {
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

    public String getWebsiteUrl() {
        return websiteUrl;
    }

    public void setWebsiteUrl(String websiteUrl) {
        this.websiteUrl = websiteUrl;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }
}