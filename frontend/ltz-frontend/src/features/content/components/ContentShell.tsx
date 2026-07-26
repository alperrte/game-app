import { useEffect, useState, type ReactNode } from "react";
import { ArrowUp } from "lucide-react";

interface ContentShellProps {
    children: ReactNode;
}

function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        function handleScroll() {
            setVisible(window.scrollY > 640);
        }
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (!visible) return null;

    return (
        <button
            type="button"
            aria-label="Sayfa başına dön"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 grid h-11 w-11 place-items-center rounded-full border border-violet-400/30 bg-slate-950/90 text-violet-200 shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur transition hover:border-violet-400/60 hover:text-white"
        >
            <ArrowUp size={18} strokeWidth={2.25} />
        </button>
    );
}

export function ContentShell({ children }: ContentShellProps) {
    return (
        <div className="relative bg-[#020817] text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(88,28,255,0.22),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(168,85,247,0.12),transparent_30%),linear-gradient(180deg,#050b18_0%,#020817_48%,#02111f_100%)]" />

            <div className="relative min-h-screen">
                <main className="mx-auto max-w-[1840px] px-4 py-8 sm:px-6 lg:px-8">
                    {children}
                </main>
            </div>

            <ScrollToTopButton />
        </div>
    );
}
