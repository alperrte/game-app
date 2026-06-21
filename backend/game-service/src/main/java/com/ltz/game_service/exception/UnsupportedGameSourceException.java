package com.ltz.game_service.exception;

import com.ltz.game_service.enums.GameSource;

public class UnsupportedGameSourceException extends RuntimeException {

    public UnsupportedGameSourceException(GameSource source) {
        super("Desteklenmeyen oyun kaynağı: " + source);
    }
}