package com.ltz.social_service.dto.request;

import com.ltz.social_service.enums.CommunityEventType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CommunityEventUpdateRequest {

    @NotBlank
    @Size(max = 150)
    private String title;

    @NotBlank
    @Size(max = 1500)
    private String description;

    @NotNull
    private CommunityEventType eventType;

    @Size(max = 255)
    private String location;

    @Size(max = 500)
    private String imageUrl;

    @NotNull
    @Future
    private LocalDateTime startsAt;

    @Future
    private LocalDateTime endsAt;

    @Min(1)
    @Max(100000)
    private Integer capacity;
}
