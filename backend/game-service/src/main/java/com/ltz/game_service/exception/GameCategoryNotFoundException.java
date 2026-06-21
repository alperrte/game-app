package com.ltz.game_service.exception;

public class GameCategoryNotFoundException extends RuntimeException {

    public GameCategoryNotFoundException(Long id) {
        super("Kategori bulunamadı. ID: " + id);
    }
}