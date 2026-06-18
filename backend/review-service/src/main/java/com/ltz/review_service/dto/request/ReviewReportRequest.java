package com.ltz.review_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewReportRequest {

    @NotNull(message = "Kullanıcı ID boş olamaz.")
    private Long userId;

    @NotBlank(message = "Rapor sebebi boş olamaz.")
    @Size(max = 500, message = "Rapor sebebi en fazla 500 karakter olabilir.")
    private String reason;
}