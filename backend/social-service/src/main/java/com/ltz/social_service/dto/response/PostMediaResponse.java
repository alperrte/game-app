package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostMediaResponse {

    private String url;
    private String mediaType;
    private String contentType;
    private Long size;
}
