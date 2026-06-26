package com.ltz.user_service.exception;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 🛡️ GlobalExceptionHandler
 * 
 * Sunucu genelinde oluşabilecek istisnaları (Exceptions) yakalayan ve istemciye
 * standart, temiz ve güvenli JSON formatında hata yanıtları dönen merkezi denetleyicidir.
 * 
 * 📌 GÜVENLİK SIZMA KORUMASI (Stack Trace Hiding):
 * - Spring'in varsayılan hata sayfaları Java sınıf isimlerini, satır numaralarını ve sql sorgularını
 *   açıkça göstererek saldırganlar için bilgi sızıntısı oluşturur.
 * - Bu sınıf, tüm Java tabanlı hataları maskeleyerek sistemin iç yapısını dış dünyaya gizler.
 * 
 * 🚀 GELECEK GENİŞLETME NOTLARI:
 * - Yeni hata tipleri eklendiğinde (Örn: `FileAlreadyExistsException` veya `MaxUploadSizeExceededException`)
 *   buraya yeni bir `@ExceptionHandler` metodu eklenerek kolayca yönetilebilir.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Aranan kaynak (Örn: Profil veya Bağlı Hesap) veritabanında bulunamadığında fırlatılan hatayı yakalar.
     * HTTP Status: 404 Not Found
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.warn("Resource not found in user-service: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    /**
     * Yetki ihlalleri veya geçersiz iş mantığı isteklerinde fırlatılan hatayı yakalar.
     * HTTP Status: 400 Bad Request
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequestException(BadRequestException ex) {
        log.warn("Bad request exception in user-service: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * DTO doğrulama kuralları (@Size, @NotBlank vb.) ihlal edildiğinde fırlatılan hatayı yakalar.
     * HTTP Status: 400 Bad Request
     * 
     * 📌 FARK: Hangi alanların (field) hata verdiğini tek tek detaylar listesine (details) ekler.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());

        log.warn("Method argument validation failed in user-service: {}", details);

        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message("Validation failed")
                .details(details)
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Veritabanı benzersizlik (unique) veya yabancı anahtar kısıtlamaları çiğnendiğinde fırlatılır.
     * Örneğin, bir kullanıcının STEAM hesabını ikinci kez bağlamaya çalışması durumunda çalışır.
     * HTTP Status: 409 Conflict
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityException(org.springframework.dao.DataIntegrityViolationException ex) {
        log.warn("Database integrity constraint violation in user-service: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message("Database integrity constraint violation: Unique constraint or duplicate entry violation.")
                .build();
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    /**
     * Spring Security yetki ihlali (AccessDeniedException) oluştuğunda tetiklenir.
     * HTTP Status: 403 Forbidden
     */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex) {
        log.warn("Access denied in user-service: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message("Access denied: You do not have permission to perform this action.")
                .build();
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    /**
     * Yüklenen dosya boyutu Multipart sınırlarını (10MB) aştığında fırlatılır.
     * HTTP Status: 413 Payload Too Large
     */
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        log.warn("Max upload size exceeded in user-service: {}", ex.getMessage());
        HttpStatus status = HttpStatus.valueOf(413);
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(status.value())
                .error(status.getReasonPhrase())
                .message("Upload failed: File size exceeds the maximum limit of 10MB.")
                .build();
        return new ResponseEntity<>(response, status);
    }

    /**
     * İstemci yanlış HTTP fiili (Örn: GET yerine POST) kullandığında tetiklenir.
     * HTTP Status: 405 Method Not Allowed
     */
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupportedException(org.springframework.web.HttpRequestMethodNotSupportedException ex) {
        log.warn("HTTP Method not supported in user-service: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.METHOD_NOT_ALLOWED.value())
                .error(HttpStatus.METHOD_NOT_ALLOWED.getReasonPhrase())
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(response, HttpStatus.METHOD_NOT_ALLOWED);
    }

    /**
     * İstemci desteklenmeyen medya formatı (Örn: JSON yerine XML) gönderdiğinde tetiklenir.
     * HTTP Status: 415 Unsupported Media Type
     */
    @ExceptionHandler(org.springframework.web.HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaTypeNotSupportedException(org.springframework.web.HttpMediaTypeNotSupportedException ex) {
        log.warn("HTTP Media type not supported in user-service: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNSUPPORTED_MEDIA_TYPE.value())
                .error(HttpStatus.UNSUPPORTED_MEDIA_TYPE.getReasonPhrase())
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(response, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }

    /**
     * Path variable veya request param tipleri eşleşmediğinde (Örn: sayı yerine metin verilmesi) tetiklenir.
     * HTTP Status: 400 Bad Request
     */
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatchException(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        String message = String.format("Parameter '%s' should be of type '%s'", ex.getName(), 
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");
        log.warn("Method argument type mismatch in user-service: {}", message);
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(message)
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Gerekli bir request parametresi eksik gönderildiğinde tetiklenir.
     * HTTP Status: 400 Bad Request
     */
    @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParameterException(org.springframework.web.bind.MissingServletRequestParameterException ex) {
        log.warn("Missing servlet request parameter in user-service: {}", ex.getMessage());
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Yukarıdaki hiçbir filtreye uymayan genel Java/Sistem hatalarını yakalar (NullPointerException, DB kopmaları vb.).
     * HTTP Status: 500 Internal Server Error
     * 
     * 📌 GÜVENLİK: Stacktrace gizlenerek dışarıya sabit güvenli bir mesaj döndürülür.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        log.error("An unexpected error occurred in user-service: ", ex);
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .message("An unexpected error occurred. Please try again later.")
                .build();
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * İstemciye dönülecek standart hata şablonu.
     */
    @Data
    @Builder
    @AllArgsConstructor
    private static class ErrorResponse {
        private LocalDateTime timestamp;
        private int status;
        private String error;
        private String message;
        private List<String> details;
    }
}
