/*
 * Marka (brand) ikonları.
 *
 * lucide-react marka/brand ikonlarını (Steam, X, Twitch, Discord) içermediği için
 * bunlar küçük inline SVG componentleri olarak burada tanımlanır.
 * currentColor kullanır; boyut "size" prop'u ile kontrol edilir.
 */

interface BrandIconProps {
    size?: number;
    className?: string;
}

export function SteamIcon({ size = 18, className }: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M11.98 2C6.4 2 1.86 6.27 1.5 11.7l5.62 2.32a3.1 3.1 0 0 1 1.76-.55l2.5-3.62v-.05a4.13 4.13 0 1 1 4.13 4.13h-.1l-3.57 2.55v.13a3.1 3.1 0 0 1-6.17.4l-4.02-1.66A10 10 0 1 0 11.98 2zM8.5 17.16l-1.29-.53a2.35 2.35 0 0 0 4.3-1.18 2.35 2.35 0 0 0-3.24-2.17l1.33.55a1.73 1.73 0 1 1-1.1 3.33zm9.88-7.3a2.75 2.75 0 1 0-5.5 0 2.75 2.75 0 0 0 5.5 0zm-4.81 0a2.07 2.07 0 1 1 4.13 0 2.07 2.07 0 0 1-4.13 0z" />
        </svg>
    );
}

export function XIcon({ size = 16, className }: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.65l7.73-8.84L1.23 2.25h6.83l4.71 6.23 5.47-6.23zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z" />
        </svg>
    );
}

export function TwitchIcon({ size = 16, className }: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M4.27 2 3 5.4v13.6h4.66V22h2.6l2.6-2.99h3.9L22 13.8V2H4.27zm15.13 11.13-2.6 2.99h-3.9l-2.6 2.99v-2.99H6.96V3.7h12.44v9.43zM16.8 6.7v5.46h-1.74V6.7h1.74zm-4.67 0v5.46h-1.74V6.7h1.74z" />
        </svg>
    );
}

/*
 * Discord marka ikonu — sosyal medya bağlantısı için (OAuth/giriş değildir).
 */
export function DiscordIcon({ size = 18, className }: BrandIconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={className}
            aria-hidden="true"
        >
            <path d="M20.32 4.37A19.8 19.8 0 0 0 15.45 3a13.7 13.7 0 0 0-.62 1.27 18.27 18.27 0 0 0-5.66 0A13.4 13.4 0 0 0 8.54 3a19.74 19.74 0 0 0-4.88 1.37C.56 8.98-.28 13.48.14 17.9a19.9 19.9 0 0 0 6.07 3.08c.49-.67.92-1.38 1.3-2.12-.71-.27-1.4-.6-2.05-.99.17-.13.34-.26.5-.4a14.2 14.2 0 0 0 12.08 0c.16.14.33.27.5.4-.65.39-1.34.72-2.06.99.38.74.81 1.45 1.3 2.12a19.84 19.84 0 0 0 6.08-3.08c.5-5.12-.84-9.58-3.53-13.53zM8.02 15.18c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42s2.17 1.09 2.15 2.42c0 1.33-.95 2.41-2.15 2.41zm7.96 0c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.42 2.15-2.42s2.17 1.09 2.15 2.42c0 1.33-.94 2.41-2.15 2.41z" />
        </svg>
    );
}
