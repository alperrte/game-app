package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PostPollVoteRequest {

    @NotNull(message = "Anket seçeneği gereklidir")
    private Long optionId;
}
