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
public class ConnectedAccountResponse {
    private Long id;
    private String userId;
    private String platformName;
    private String platformUserId;
    private String platformUsername;
    private LocalDateTime connectedAt;
}
