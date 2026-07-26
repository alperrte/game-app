package com.ltz.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateProfileReviewRequest {

    @NotBlank(message = "Review content cannot be blank")
    @Size(max = 1000, message = "Review content cannot exceed 1000 characters")
    private String content;

    private boolean friendlyPoint;
    private boolean leaderPoint;
    private boolean aimGodPoint;
    private boolean tacticianPoint;
}
