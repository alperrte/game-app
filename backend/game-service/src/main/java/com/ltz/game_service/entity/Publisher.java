package com.ltz.game_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

@Entity
@Table(name = "publishers")
public class Publisher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Yayıncı adı boş bırakılamaz.")
    @Size(max = 150, message = "Yayıncı adı en fazla 150 karakter olabilir.")
    @Column(name = "name", nullable = false, unique = true, length = 150)
    private String name;

    @Size(max = 1000, message = "Yayıncı açıklaması en fazla 1000 karakter olabilir.")
    @Column(name = "description", length = 1000)
    private String description;

    @Size(max = 500, message = "Website URL bilgisi en fazla 500 karakter olabilir.")
    @Column(name = "website_url", length = 500)
    private String websiteUrl;

    @Size(max = 100, message = "Ülke bilgisi en fazla 100 karakter olabilir.")
    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Publisher() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}