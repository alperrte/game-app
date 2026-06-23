package com.ltz.social_service.exception;

import org.apache.tomcat.util.http.fileupload.impl.FileSizeLimitExceededException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Pattern BYTE_SIZE_PATTERN = Pattern.compile("(\\d+)\\s*bytes");

    @Value("${spring.servlet.multipart.max-file-size:10MB}")
    private String configuredMaxFileSize;

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException exception) {
        return errorResponse(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException exception) {
        return errorResponse(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException exception
    ) {
        return errorResponse(HttpStatus.FORBIDDEN, exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> errors = new LinkedHashMap<>();

        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.put("message", "Validation failed");
        body.put("details", errors);

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSize(MaxUploadSizeExceededException exception) {
        return errorResponse(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Medya dosyası çok büyük. En fazla " + resolveLimitText(exception) + " yükleyebilirsin."
        );
    }

    @ExceptionHandler(FileSizeLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleFileSizeLimit(FileSizeLimitExceededException exception) {
        return errorResponse(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Medya dosyası çok büyük. En fazla " + resolveLimitText(exception) + " yükleyebilirsin."
        );
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, Object>> handleMultipart(MultipartException exception) {
        return errorResponse(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Medya dosyası çok büyük. En fazla " + resolveLimitText(exception) + " yükleyebilirsin."
        );
    }

    private ResponseEntity<Map<String, Object>> errorResponse(HttpStatus status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);

        return ResponseEntity.status(status).body(body);
    }

    private String resolveLimitText(Exception exception) {
        Long byteLimit = findByteLimit(exception);
        String configuredLimit = normalizeConfiguredLimit(configuredMaxFileSize);

        if (byteLimit != null && byteLimit > 0) {
            if (isConfiguredLimitLarger(byteLimit, configuredLimit)) {
                return configuredLimit;
            }

            return formatMegabytes(byteLimit);
        }

        return configuredLimit;
    }

    private Long findByteLimit(Throwable throwable) {
        Throwable current = throwable;

        while (current != null) {
            Long reflectedLimit = readPermittedSize(current);

            if (reflectedLimit != null && reflectedLimit > 0) {
                return reflectedLimit;
            }

            Matcher matcher = BYTE_SIZE_PATTERN.matcher(String.valueOf(current.getMessage()));

            if (matcher.find()) {
                return Long.parseLong(matcher.group(1));
            }

            current = current.getCause();
        }

        return null;
    }

    private Long readPermittedSize(Throwable throwable) {
        try {
            Object value = throwable.getClass().getMethod("getPermittedSize").invoke(throwable);

            if (value instanceof Number number) {
                return number.longValue();
            }
        } catch (ReflectiveOperationException ignored) {
            // Exception type does not expose a permitted-size accessor.
        }

        return null;
    }

    private String formatMegabytes(long bytes) {
        double megabytes = bytes / 1024.0 / 1024.0;

        if (megabytes == Math.floor(megabytes)) {
            return String.format("%.0f MB", megabytes);
        }

        return String.format("%.2f MB", megabytes);
    }

    private String normalizeConfiguredLimit(String configuredLimit) {
        return configuredLimit.replaceAll("(?i)mb$", " MB");
    }

    private boolean isConfiguredLimitLarger(long byteLimit, String configuredLimit) {
        String numericPart = configuredLimit.replaceAll("[^0-9.]", "");

        if (numericPart.isBlank()) {
            return false;
        }

        double configuredMegabytes = Double.parseDouble(numericPart);
        double exceptionMegabytes = byteLimit / 1024.0 / 1024.0;

        return configuredMegabytes > exceptionMegabytes;
    }
}
