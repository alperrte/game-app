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

    /**
     * Aranan kaynak (Örn: Profil veya Bağlı Hesap) veritabanında bulunamadığında fırlatılan hatayı yakalar.
     * HTTP Status: 404 Not Found
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex) {
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
        ErrorResponse response = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.getReasonPhrase())
                .message("Database integrity constraint violation: Unique constraint or duplicate entry violation.")
                .build();
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    /**
     * Yukarıdaki hiçbir filtreye uymayan genel Java/Sistem hatalarını yakalar (NullPointerException, DB kopmaları vb.).
     * HTTP Status: 500 Internal Server Error
     * 
     * 📌 GÜVENLİK: Stacktrace gizlenerek dışarıya sabit güvenli bir mesaj döndürülür.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
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
