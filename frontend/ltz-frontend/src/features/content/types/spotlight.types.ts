export interface SpotlightBanner {
    id: number;
    title: string;
    subtitle?: string | null;
    imageUrl: string;
    targetUrl: string;
    displayOrder: number;
    active: boolean;
}
