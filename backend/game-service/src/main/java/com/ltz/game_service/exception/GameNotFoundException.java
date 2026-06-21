package com.ltz.game_service.exception;

public class GameNotFoundException extends RuntimeException {

    public GameNotFoundException(Long id) {
        super("Oyun bulunamadı. ID: " + id);
    }
}