package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MediaUploadResponse {

    private String imageUrl;
    private String fileName;
    private String contentType;
    private String mediaType;
    private Long size;
}
