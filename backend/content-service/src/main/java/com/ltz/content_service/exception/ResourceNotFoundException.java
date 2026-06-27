package com.ltz.content_service.exception;

import org.springframework.http.HttpStatus;

public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String message) {
        super(
                ErrorCode.CONTENT_NOT_FOUND,
                HttpStatus.NOT_FOUND,
                message);
    }
}