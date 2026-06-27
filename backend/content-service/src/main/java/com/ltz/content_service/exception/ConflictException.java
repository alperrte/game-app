package com.ltz.content_service.exception;

import org.springframework.http.HttpStatus;

public class ConflictException extends BusinessException {

    public ConflictException(String message) {
        super(
                ErrorCode.CONFLICT,
                HttpStatus.CONFLICT,
                message);
    }
}