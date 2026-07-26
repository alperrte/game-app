package com.ltz.content_service.dto;

import com.ltz.content_service.enums.ReactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReactionRequest {
    @NotNull
    private Long contentId;

    @NotBlank
    private String contentType;

    @NotNull
    private ReactionType reactionType;
}
