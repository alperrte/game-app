/*
 * Login panelinin altındaki sosyal medya bağlantıları (takip linkleri).
 *
 * DİKKAT: Bunlar OAuth/giriş DEĞİLDİR; yalnızca LTZ'nin dış sosyal medya
 * hesaplarına yönlendiren linklerdir. (Instagram, X, YouTube, Discord)
 *
 * Discord linki .env'deki VITE_DISCORD_INVITE_URL'den gelir (sunucu daveti).
 */

import { Instagram, Youtube } from "lucide-react";
import { SOCIAL_LINKS } from "../../../lib/constants";
import { DiscordIcon, XIcon } from "./BrandIcons";

const SOCIALS = [
    { label: "Instagram", href: SOCIAL_LINKS.instagram, icon: <Instagram size={17} /> },
    { label: "X", href: SOCIAL_LINKS.x, icon: <XIcon size={14} /> },
    { label: "YouTube", href: SOCIAL_LINKS.youtube, icon: <Youtube size={18} /> },
    { label: "Discord", href: SOCIAL_LINKS.discord, icon: <DiscordIcon size={17} /> },
];

export function SocialMediaLinks() {
    return (
        <div className="mt-5 flex items-center justify-center gap-3">
            {SOCIALS.map((social) => {
                /* Gerçek bir dış URL ise yeni sekmede aç; placeholder (#) ise açma. */
                const isExternal = social.href.startsWith("http");

                return (
                    <a
                        key={social.label}
                        href={social.href}
                        aria-label={social.label}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="social-link flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400"
                    >
                        {social.icon}
                    </a>
                );
            })}
        </div>
    );
}
