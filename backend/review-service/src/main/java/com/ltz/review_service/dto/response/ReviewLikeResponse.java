package com.ltz.review_service.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ReviewLikeResponse {

    private Long reviewId;

    private Long userId;

    private Integer likeCount;

    private Boolean liked;
}