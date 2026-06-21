package com.ltz.game_service.exception;

import com.ltz.game_service.enums.GameSource;

public class ExternalGameServiceUnavailableException extends RuntimeException {

    public ExternalGameServiceUnavailableException(GameSource source, Throwable cause) {
        super(source + " harici oyun servisine şu anda ulaşılamıyor.", cause);
    }
}