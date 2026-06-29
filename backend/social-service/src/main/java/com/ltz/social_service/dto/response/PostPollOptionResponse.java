package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostPollOptionResponse {
    private Long id;
    private String text;
    private Long voteCount;
    private Integer percentage;
    private Boolean selectedByCurrentUser;
}
