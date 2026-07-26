package com.ltz.content_service.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class DailyTriviaResponse {
    private Long id;
    private String question;
    private String optionsJson;
    private int correctOptionIndex;
    private LocalDate triviaDate;
    private LocalDateTime createdAt;
}
