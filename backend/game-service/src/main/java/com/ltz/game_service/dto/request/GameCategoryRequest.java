package com.ltz.game_service.dto.request;

import com.ltz.game_service.enums.GameSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class GameCategoryRequest {

    private GameSource source;

    @NotBlank(message = "Kategori adı boş bırakılamaz.")
    @Size(max = 100, message = "Kategori adı en fazla 100 karakter olabilir.")
    private String name;

    @Size(max = 500, message = "Kategori açıklaması en fazla 500 karakter olabilir.")
    private String description;

    public GameCategoryRequest() {
    }

    public GameSource getSource() {
        return source;
    }

    public void setSource(GameSource source) {
        this.source = source;
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