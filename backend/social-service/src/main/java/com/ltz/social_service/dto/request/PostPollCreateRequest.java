package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PostPollCreateRequest {

    @NotBlank(message = "Anket sorusu gereklidir")
    @Size(max = 160, message = "Anket sorusu en fazla 160 karakter olabilir")
    private String question;

    @NotNull(message = "Anket seçenekleri gereklidir")
    @Size(min = 2, max = 4, message = "Ankette 2 ile 4 arasında seçenek olmalıdır")
    private List<
            @NotBlank(message = "Anket seçeneği boş olamaz")
            @Size(max = 120, message = "Anket seçeneği en fazla 120 karakter olabilir")
            String> options;

    @Min(value = 5, message = "Anket süresi en az 5 dakika olmalıdır")
    @Max(value = 10080, message = "Anket süresi en fazla 7 gün olabilir")
    private int durationMinutes;
}
