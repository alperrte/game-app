export interface TodayTriviaResponse {
    id: number | null;
    question: string;
    options: string[];
    triviaDate: string;
    hasAnswered: boolean;
    wasCorrect?: boolean;
    correctOptionIndex?: number;
}

export interface TriviaSubmitResponse {
    correct: boolean;
    correctOptionIndex: number;
    message: string;
}

export interface TriviaHistoryEntry {
    date: string;
    correct: boolean;
}

export interface TriviaStatsResponse {
    currentStreak: number;
    totalAnswered: number;
    totalCorrect: number;
    history: TriviaHistoryEntry[];
}
