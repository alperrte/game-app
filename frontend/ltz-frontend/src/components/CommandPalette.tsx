import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";

import { CONTENT_ROUTES, GAME_ROUTES, ROUTES, SOCIAL_ROUTES } from "../lib/constants";

interface Command {
    label: string;
    description: string;
    action: (navigate: ReturnType<typeof useNavigate>) => void;
}

const STATIC_COMMANDS: Command[] = [
    { label: "Ana Sayfa", description: "Sosyal akış", action: (nav) => nav(ROUTES.home) },
    { label: "Oyun Merkezi", description: "content-service ana panel", action: (nav) => nav(CONTENT_ROUTES.hub) },
    { label: "İndirimler", description: "Aktif kampanyalar", action: (nav) => nav(CONTENT_ROUTES.deals) },
    { label: "Haberler", description: "RSS akışı", action: (nav) => nav(CONTENT_ROUTES.news) },
    { label: "Espor", description: "Canlı ve yaklaşan maçlar", action: (nav) => nav(CONTENT_ROUTES.esports) },
    { label: "Ücretsiz Oyunlar", description: "Epic & giveaway", action: (nav) => nav(CONTENT_ROUTES.free) },
    { label: "Günlük Trivia", description: "Streak ve geçmiş", action: (nav) => nav(CONTENT_ROUTES.trivia) },
    { label: "Oyun Tarihi", description: "Bugün ne oldu", action: (nav) => nav(CONTENT_ROUTES.history) },
    { label: "Oyunlar", description: "Oyun kataloğu", action: (nav) => nav(GAME_ROUTES.games) },
    { label: "Topluluklar", description: "Sosyal topluluklar", action: (nav) => nav(SOCIAL_ROUTES.communities) },
    { label: "Etkinlikler", description: "Topluluk etkinlikleri", action: (nav) => nav(SOCIAL_ROUTES.events) },
    { label: "Mesajlar", description: "Sohbetler", action: (nav) => nav(SOCIAL_ROUTES.messages) },
    { label: "Keşfet", description: "Yeni içerik ve kişiler", action: (nav) => nav(SOCIAL_ROUTES.explore) },
];

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        function handleGlobalKeyDown(event: KeyboardEvent) {
            const isModifierK =
                (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
            if (isModifierK) {
                event.preventDefault();
                setIsOpen((current) => !current);
            } else if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        window.addEventListener("keydown", handleGlobalKeyDown);
        return () => window.removeEventListener("keydown", handleGlobalKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setActiveIndex(0);
        }
    }, [isOpen]);

    const trimmedQuery = query.trim();

    const matchedCommands = useMemo(() => {
        if (!trimmedQuery) return STATIC_COMMANDS;
        const q = trimmedQuery.toLowerCase();
        return STATIC_COMMANDS.filter(
            (command) =>
                command.label.toLowerCase().includes(q) ||
                command.description.toLowerCase().includes(q),
        );
    }, [trimmedQuery]);

    const searchCommands: Command[] = trimmedQuery
        ? [
              {
                  label: `İndirimlerde ara: "${trimmedQuery}"`,
                  description: "İndirimler sayfasında bu terimi ara",
                  action: (nav) =>
                      nav(`${CONTENT_ROUTES.deals}?q=${encodeURIComponent(trimmedQuery)}`),
              },
              {
                  label: `Haberlerde ara: "${trimmedQuery}"`,
                  description: "Yüklenen haberlerde başlığa göre filtrele",
                  action: (nav) =>
                      nav(`${CONTENT_ROUTES.news}?q=${encodeURIComponent(trimmedQuery)}`),
              },
              {
                  label: `Espor maçlarında ara: "${trimmedQuery}"`,
                  description: "Takım veya turnuva adına göre filtrele",
                  action: (nav) =>
                      nav(`${CONTENT_ROUTES.esports}?q=${encodeURIComponent(trimmedQuery)}`),
              },
          ]
        : [];

    const allCommands = [...matchedCommands, ...searchCommands];

    function runCommand(command: Command) {
        command.action(navigate);
        setIsOpen(false);
    }

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
        >
            <div
                role="dialog"
                aria-label="Komut paleti"
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
                <label className="relative block border-b border-white/10">
                    <Search
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                        autoFocus
                        value={query}
                        onChange={(event) => {
                            setQuery(event.target.value);
                            setActiveIndex(0);
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "ArrowDown") {
                                event.preventDefault();
                                setActiveIndex((i) =>
                                    Math.min(i + 1, allCommands.length - 1),
                                );
                            } else if (event.key === "ArrowUp") {
                                event.preventDefault();
                                setActiveIndex((i) => Math.max(i - 1, 0));
                            } else if (event.key === "Enter") {
                                const command = allCommands[activeIndex];
                                if (command) runCommand(command);
                            }
                        }}
                        placeholder="Sayfa ara veya içerik ara..."
                        className="h-14 w-full bg-transparent pl-12 pr-4 text-sm text-white outline-none placeholder:text-slate-500"
                    />
                </label>

                <div className="max-h-80 overflow-y-auto p-2">
                    {allCommands.length === 0 ? (
                        <p className="px-3 py-6 text-center text-sm text-slate-500">
                            Sonuç bulunamadı.
                        </p>
                    ) : (
                        allCommands.map((command, index) => (
                            <button
                                key={`${command.label}-${index}`}
                                type="button"
                                onClick={() => runCommand(command)}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left transition ${
                                    index === activeIndex
                                        ? "bg-violet-500/15 text-white"
                                        : "text-slate-300"
                                }`}
                            >
                                <span className="text-sm font-semibold">
                                    {command.label}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {command.description}
                                </span>
                            </button>
                        ))
                    )}
                </div>

                <div className="border-t border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-slate-500">
                    ↑↓ gezin · Enter seç · Esc kapat
                </div>
            </div>
        </div>
    );
}
