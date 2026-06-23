package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class PostPollResponse {
    private Long id;
    private String question;
    private LocalDateTime expiresAt;
    private Boolean closed;
    private Long totalVotes;
    private Long selectedOptionId;
    private List<PostPollOptionResponse> options;
}
