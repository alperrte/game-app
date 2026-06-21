package com.ltz.game_service.exception;

public class RateLimitExceededException extends RuntimeException {

    public RateLimitExceededException() {
        super("Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin.");
    }
}