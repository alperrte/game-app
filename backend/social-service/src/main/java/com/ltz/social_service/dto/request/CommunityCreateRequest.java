package com.ltz.social_service.dto.request;

import com.ltz.social_service.enums.CommunityVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CommunityCreateRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(max = 1000)
    private String description;

    @Size(max = 80)
    private String category;

    @Size(max = 500)
    private String imageUrl;

    private CommunityVisibility visibility;
}
