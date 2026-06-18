package com.ltz.review_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateReviewRequest {

    @NotNull(message = "Puan boş olamaz.")
    @Min(value = 1, message = "Puan en az 1 olmalıdır.")
    @Max(value = 10, message = "Puan en fazla 10 olmalıdır.")
    private Integer rating;

    @NotBlank(message = "İnceleme metni boş olamaz.")
    @Size(max = 3000, message = "İnceleme metni en fazla 3000 karakter olabilir.")
    private String reviewText;

    @NotNull(message = "Olumlu/olumsuz değerlendirme boş olamaz.")
    private Boolean recommended;

    @PositiveOrZero(message = "Oynama süresi saati negatif olamaz.")
    private Integer playtimeHours;

    @Min(value = 0, message = "Oynama süresi dakikası en az 0 olmalıdır.")
    @Max(value = 59, message = "Oynama süresi dakikası en fazla 59 olmalıdır.")
    private Integer playtimeMinutes;

    @Size(max = 100, message = "Platform en fazla 100 karakter olabilir.")
    private String platform;

    @Size(max = 500, message = "Donanım bilgisi en fazla 500 karakter olabilir.")
    private String hardwareInfo;
}