package com.ltz.user_service.dto.client.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewClientResponse {
    private Long id;
    private String gameSource;
    private Long gameId;
    private String externalGameId;
    private Long userId;
    private Integer rating;
    private String reviewText;
    private Boolean recommended;
    private Integer playtimeHours;
    private String platform;
    private Integer likeCount;
    private LocalDateTime createdAt;
}
