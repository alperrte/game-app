/*
 * Login panelinin altında yer alan küçük dekoratif gaming HUD şeridi.
 *
 * İçerik:
 *  - Sol: LVL / ACCESS rozetleri (dekoratif, ana tasarımı kalabalıklaştırmaz)
 *  - Sağ: minimal Twitter/X ve Twitch sosyal ikonları (neon hover)
 *
 * Sosyal ikonlar küçük tutularak ana CTA'dan (Giriş Yap) rol çalmaması sağlanır.
 */

import { TwitchIcon, XIcon } from "./BrandIcons";

function HudTag({ label, value }: { label: string; value: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1">
            <span className="text-[9px] font-bold tracking-[0.2em] text-violet-300">
                {label}
            </span>
            <span className="text-[10px] font-semibold text-zinc-200">{value}</span>
        </span>
    );
}

export function LoginHud() {
    return (
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <HudTag label="LVL" value="20" />
                <HudTag label="LTZ" value="ACCESS" />
            </div>

            <div className="flex items-center gap-2">
                <a
                    href="#"
                    aria-label="Twitter / X"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition-all hover:-translate-y-0.5 hover:border-cyan-400/50 hover:text-cyan-300"
                >
                    <XIcon size={14} />
                </a>
                <a
                    href="#"
                    aria-label="Twitch"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition-all hover:-translate-y-0.5 hover:border-fuchsia-400/50 hover:text-fuchsia-300"
                >
                    <TwitchIcon size={15} />
                </a>
            </div>
        </div>
    );
}
