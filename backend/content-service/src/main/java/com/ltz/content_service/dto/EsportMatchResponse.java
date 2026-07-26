package com.ltz.content_service.dto;

import com.ltz.content_service.enums.MatchStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EsportMatchResponse {
    private Long id;
    private String matchId;
    private String tournamentName;
    private String teamAName;
    private String teamBName;
    private int teamAScore;
    private int teamBScore;
    private String gameName;
    private MatchStatus status;
    private LocalDateTime matchTime;
}
