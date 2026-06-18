export interface GamingHistoryEvent {
    id: number;
    eventDay: number;
    eventMonth: number;
    eventYear: number;
    title: string;
    description: string;
    imageUrl?: string | null;
    createdAt: string;
}
