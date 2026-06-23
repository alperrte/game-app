package com.ltz.hardware_service.dto.request;

import com.ltz.hardware_service.entity.enums.HardwareReviewType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HardwareReviewCreateRequest {

    @NotNull(message = "Donanım bileşeni boş olamaz.")
    private Long componentId;

    @NotNull(message = "İnceleme tipi boş olamaz.")
    private HardwareReviewType reviewType;

    @Min(value = 1, message = "Puan en az 1 olabilir.")
    @Max(value = 10, message = "Puan en fazla 10 olabilir.")
    private Integer rating;

    @NotBlank(message = "Başlık boş olamaz.")
    @Size(max = 200, message = "Başlık en fazla 200 karakter olabilir.")
    private String title;

    @NotBlank(message = "İçerik boş olamaz.")
    private String content;

    private String pros;

    private String cons;

    @Min(value = 0, message = "Kullanım süresi negatif olamaz.")
    private Integer usageDurationMonths;
}