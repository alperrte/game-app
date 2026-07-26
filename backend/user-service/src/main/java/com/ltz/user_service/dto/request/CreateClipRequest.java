package com.ltz.user_service.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateClipRequest {

    @NotBlank(message = "Clip title cannot be blank")
    @Size(max = 100, message = "Clip title cannot exceed 100 characters")
    private String title;

    @NotBlank(message = "Clip URL cannot be blank")
    @Size(max = 255, message = "Clip URL cannot exceed 255 characters")
    private String videoUrl;
}
