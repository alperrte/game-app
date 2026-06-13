package com.ltz.game_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GameCategoryRequest {

    @NotBlank(message = "Kategori adı boş bırakılamaz.")
    @Size(max = 100, message = "Kategori adı en fazla 100 karakter olabilir.")
    private String name;

    @Size(max = 500, message = "Kategori açıklaması en fazla 500 karakter olabilir.")
    private String description;

    public GameCategoryRequest() {
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
}