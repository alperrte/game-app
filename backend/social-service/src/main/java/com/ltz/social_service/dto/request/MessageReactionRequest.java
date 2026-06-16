package com.ltz.social_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageReactionRequest {

    @NotBlank(message = "Emoji is required")
    @Size(max = 16, message = "Emoji can be at most 16 characters")
    private String emoji;
}
