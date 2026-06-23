package com.ltz.hardware_service.dto.request;

import com.ltz.hardware_service.entity.enums.HardwareReviewType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HardwareReviewUpdateRequest {

    private HardwareReviewType reviewType;

    @Min(value = 1, message = "Puan en az 1 olabilir.")
    @Max(value = 10, message = "Puan en fazla 10 olabilir.")
    private Integer rating;

    @Size(max = 200, message = "Başlık en fazla 200 karakter olabilir.")
    private String title;

    private String content;

    private String pros;

    private String cons;

    @Min(value = 0, message = "Kullanım süresi negatif olamaz.")
    private Integer usageDurationMonths;
}