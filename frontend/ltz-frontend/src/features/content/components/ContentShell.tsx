import type { ReactNode } from "react";

interface ContentShellProps {
    children: ReactNode;
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
        </div>
    );
}
