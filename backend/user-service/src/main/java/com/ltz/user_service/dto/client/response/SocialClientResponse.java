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
public class SocialClientResponse {
    private Long id;
    private Long userId;
    private Long friendUserId; // Arkadaşlar listesinden döner
    private Long followerUserId; // Takipçiler listesinden döner
    private Long followingUserId; // Takip edilenler listesinden döner
    private LocalDateTime createdAt;
}
