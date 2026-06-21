package com.ltz.content_service.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyTriviaRequest {
    private String question;
    private String optionsJson;
    private int correctOptionIndex;
    private LocalDate triviaDate;
}
