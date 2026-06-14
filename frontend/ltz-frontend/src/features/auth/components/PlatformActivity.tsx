import { Gamepad2, MessageSquareText, Radio } from "lucide-react";

const ACTIVITY_ITEMS = [
    {
        icon: Radio,
        label: "Bugün aktif lobiler",
        value: "128",
        accent: "text-emerald-300",
    },
    {
        icon: Gamepad2,
        label: "En popüler oyun",
        value: "Counter Strike 2",
        accent: "text-cyan-300",
    },
    {
        icon: MessageSquareText,
        label: "Yeni incelemeler",
        value: "342",
        accent: "text-fuchsia-300",
    },
] as const;

export function PlatformActivity() {
    return (
        <aside className="platform-activity" aria-label="Platform aktivitesi">
            <div className="platform-activity__header">
                <span className="platform-activity__status" aria-hidden="true" />
                <span>CANLI PLATFORM VERİSİ</span>
            </div>

            <div className="space-y-2">
                {ACTIVITY_ITEMS.map(({ icon: Icon, label, value, accent }) => (
                    <div className="platform-activity__row" key={label}>
                        <Icon
                            size={15}
                            strokeWidth={1.8}
                            className={accent}
                            aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1 text-zinc-400">{label}</span>
                        <strong className="max-w-40 truncate text-right text-zinc-100">
                            {value}
                        </strong>
                    </div>
                ))}
            </div>
        </aside>
    );
}
