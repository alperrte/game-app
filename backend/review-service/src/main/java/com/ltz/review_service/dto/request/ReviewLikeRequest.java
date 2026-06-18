package com.ltz.review_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewLikeRequest {

    @NotNull(message = "Kullanıcı ID boş olamaz.")
    private Long userId;
}