package com.ltz.social_service.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MessageReactionResponse {

    private String emoji;
    private Long userId;
}
