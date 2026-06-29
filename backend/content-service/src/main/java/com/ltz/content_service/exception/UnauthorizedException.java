package com.ltz.content_service.exception;

import org.springframework.http.HttpStatus;

public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message) {
        super(
                ErrorCode.UNAUTHORIZED,
                HttpStatus.UNAUTHORIZED,
                message);
    }
}