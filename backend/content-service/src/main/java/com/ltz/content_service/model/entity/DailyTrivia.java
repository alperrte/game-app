package com.ltz.content_service.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_trivias")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyTrivia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String question;

    @Column(name = "options_json", nullable = false, length = 1000)
    private String optionsJson;

    @Column(name = "correct_option_index", nullable = false)
    private int correctOptionIndex;

    @Column(name = "trivia_date", nullable = false, unique = true)
    private LocalDate triviaDate;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
