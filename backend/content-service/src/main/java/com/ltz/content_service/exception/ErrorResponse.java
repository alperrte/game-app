
package com.ltz.content_service.exception;

import java.time.LocalDateTime;

public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        ErrorCode errorCode,
        String message,
        String path) {

    public static ErrorResponse of(int status, String error, ErrorCode errorCode, String message, String path) {
        return new ErrorResponse(
                LocalDateTime.now(),
                status,
                error,
                errorCode,
                message,
                path);
    }
}