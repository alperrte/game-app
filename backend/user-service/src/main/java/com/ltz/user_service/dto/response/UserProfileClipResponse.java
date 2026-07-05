package com.ltz.user_service.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileClipResponse {
    private Long id;
    private String userId;
    private String title;
    private String videoUrl;
    private String platform;
    private LocalDateTime createdAt;
}
