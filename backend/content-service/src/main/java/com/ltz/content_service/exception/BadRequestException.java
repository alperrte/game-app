package com.ltz.content_service.exception;

import org.springframework.http.HttpStatus;

public class BadRequestException extends BusinessException {

    public BadRequestException(String message) {
        super(
                ErrorCode.BAD_REQUEST,
                HttpStatus.BAD_REQUEST,
                message);
    }
}