package com.ltz.content_service.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    @NotBlank
    private String question;

    @NotBlank
    private String optionsJson;

    @Min(0)
    private int correctOptionIndex;

    @NotNull
    private LocalDate triviaDate;
}
