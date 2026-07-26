export type EsportMatchStatus = "LIVE" | "UPCOMING" | "FINISHED";

export interface EsportMatch {
    id: number;
    matchId: string;
    tournamentName: string;
    teamAName: string;
    teamBName: string;
    teamAScore: number;
    teamBScore: number;
    gameName: string;
    status: EsportMatchStatus;
    matchTime: string;
    isSimulated?: boolean;
}
