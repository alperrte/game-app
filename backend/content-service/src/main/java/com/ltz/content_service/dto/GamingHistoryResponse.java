package com.ltz.content_service.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class GamingHistoryResponse {
    private Long id;
    private int eventDay;
    private int eventMonth;
    private int eventYear;
    private String title;
    private String description;
    private String imageUrl;
    private LocalDateTime createdAt;
}
