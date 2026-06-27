package com.ltz.content_service.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    UNKNOWN_ERROR("UNKNOWN_ERROR", "An unexpected error occurred"),
    RATE_LIMIT_EXCEEDED("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later"),
    INVALID_INPUT("INVALID_INPUT", "Invalid input data"),
    UNAUTHORIZED("UNAUTHORIZED", "Unauthorized"),
    FORBIDDEN("FORBIDDEN", "Access denied"),
    BAD_REQUEST("BAD_REQUEST", "Bad request"),
    CONTENT_NOT_FOUND("CONTENT_NOT_FOUND", "Content not found"),
    NOT_FOUND("NOT_FOUND", "Resource not found"),
    CONCURRENCY_FAILURE("CONCURRENCY_FAILURE", "Optimistic lock failure"),
    CONFLICT("CONFLICT", "Resource conflict"),
    INTERNAL_ERROR("INTERNAL_ERROR", "Internal server error");

    private final String code;
    private final String message;
}
