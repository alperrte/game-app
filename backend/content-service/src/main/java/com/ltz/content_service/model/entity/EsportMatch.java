package com.ltz.content_service.model.entity;

import com.ltz.content_service.model.enums.MatchStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "esport_matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EsportMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false, unique = true, length = 100)
    private String matchId;

    @Column(name = "tournament_name", nullable = false)
    private String tournamentName;

    @Column(name = "team_a_name", nullable = false, length = 100)
    private String teamAName;

    @Column(name = "team_b_name", nullable = false, length = 100)
    private String teamBName;

    @Column(name = "team_a_score", nullable = false)
    @Builder.Default
    private int teamAScore = 0;

    @Column(name = "team_b_score", nullable = false)
    @Builder.Default
    private int teamBScore = 0;

    @Column(name = "game_name", nullable = false, length = 50)
    private String gameName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MatchStatus status;

    @Column(name = "match_time", nullable = false)
    private LocalDateTime matchTime;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
