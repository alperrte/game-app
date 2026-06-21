package com.ltz.content_service.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GamingHistoryRequest {
    private int eventDay;
    private int eventMonth;
    private int eventYear;
    private String title;
    private String description;
    private String imageUrl;
}
