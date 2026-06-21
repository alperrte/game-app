package com.ltz.game_service.exception;

public class ExternalGameContentBlockedException extends RuntimeException {

    public ExternalGameContentBlockedException() {
        super("Bu oyun platform içerik filtresi nedeniyle gösterilemiyor.");
    }
}