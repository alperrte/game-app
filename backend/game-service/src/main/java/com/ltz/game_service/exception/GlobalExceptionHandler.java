package com.ltz.game_service.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(GameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleGameNotFoundException(
            GameNotFoundException exception,
            HttpServletRequest request
    ) {
        Map<String, Object> response = createErrorResponse(
                HttpStatus.NOT_FOUND,
                "Oyun bulunamadı.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(GameCategoryNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleGameCategoryNotFoundException(
            GameCategoryNotFoundException exception,
            HttpServletRequest request
    ) {
        Map<String, Object> response = createErrorResponse(
                HttpStatus.NOT_FOUND,
                "Kategori bulunamadı.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(ExternalGameServiceUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleExternalGameServiceUnavailableException(
            ExternalGameServiceUnavailableException exception,
            HttpServletRequest request
    ) {
        log.warn("Harici oyun servisi hatası. Path: {}", request.getRequestURI(), exception);

        Map<String, Object> response = createErrorResponse(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Harici oyun servisine şu anda ulaşılamıyor.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(ExternalGameContentBlockedException.class)
    public ResponseEntity<Map<String, Object>> handleExternalGameContentBlockedException(
            ExternalGameContentBlockedException exception,
            HttpServletRequest request
    ) {
        Map<String, Object> response = createErrorResponse(
                HttpStatus.FORBIDDEN,
                "Bu oyun platform içerik filtresi nedeniyle gösterilemiyor.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(UnsupportedGameSourceException.class)
    public ResponseEntity<Map<String, Object>> handleUnsupportedGameSourceException(
            UnsupportedGameSourceException exception,
            HttpServletRequest request
    ) {
        Map<String, Object> response = createErrorResponse(
                HttpStatus.BAD_REQUEST,
                "Desteklenmeyen oyun kaynağı.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(UnsupportedOperationException.class)
    public ResponseEntity<Map<String, Object>> handleUnsupportedOperationException(
            UnsupportedOperationException exception,
            HttpServletRequest request
    ) {
        Map<String, Object> response = createErrorResponse(
                HttpStatus.NOT_IMPLEMENTED,
                "Bu işlem henüz desteklenmiyor.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(
            IllegalArgumentException exception,
            HttpServletRequest request
    ) {
        Map<String, Object> response = createErrorResponse(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Geçersiz istek.");

        Map<String, Object> response = createErrorResponse(
                HttpStatus.BAD_REQUEST,
                message,
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatchException(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request
    ) {
        String message = "Geçersiz parametre değeri: " + exception.getName();

        Map<String, Object> response = createErrorResponse(
                HttpStatus.BAD_REQUEST,
                message,
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
            RuntimeException exception,
            HttpServletRequest request
    ) {
        log.warn("Runtime exception yakalandı. Path: {}", request.getRequestURI(), exception);

        Map<String, Object> response = createErrorResponse(
                HttpStatus.BAD_REQUEST,
                "İstek işlenirken bir hata oluştu.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneralException(
            Exception exception,
            HttpServletRequest request
    ) {
        log.error("Beklenmeyen hata oluştu. Path: {}", request.getRequestURI(), exception);

        Map<String, Object> response = createErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Beklenmeyen bir hata oluştu.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private Map<String, Object> createErrorResponse(
            HttpStatus status,
            String message,
            String path
    ) {
        Map<String, Object> response = new HashMap<>();

        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        response.put("error", status.getReasonPhrase());
        response.put("message", message);
        response.put("path", path);

        return response;
    }

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleRateLimitExceededException(
            RateLimitExceededException exception,
            HttpServletRequest request
    ) {
        Map<String, Object> response = createErrorResponse(
                HttpStatus.TOO_MANY_REQUESTS,
                "Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin.",
                request.getRequestURI()
        );

        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
    }
}