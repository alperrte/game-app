import { cn } from "../../../../utils/cn";

export type ProfileNavSection = "wall" | "about" | "hardware" | "settings" | "reviews";


const NAV_ITEMS: { id: ProfileNavSection; label: string }[] = [
  { id: "wall", label: "Duvar" },
  { id: "reviews", label: "İncelemeler" },
  { id: "about", label: "Hakkında" },
  { id: "hardware", label: "Donanım" },
];


type ProfileQuickNavProps = {
  activeSection: ProfileNavSection;
  showHardware: boolean;
  onSectionChange: (section: ProfileNavSection) => void;
};

export function ProfileQuickNav({
  activeSection,
  showHardware,
  onSectionChange,
}: ProfileQuickNavProps) {
  const visibleItems = NAV_ITEMS.filter((item) => item.id !== "hardware" || showHardware);

  return (
    <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-violet-500/20 bg-zinc-950/90 p-2 shadow-lg backdrop-blur-md">
      {visibleItems.map((item) => (
        <button
          className={cn(
            "rounded-xl px-5 py-2.5 text-sm font-bold transition",
            activeSection === item.id
              ? "bg-violet-600 text-white shadow-[0_0_20px_rgba(124,58,237,0.35)]"
              : "text-zinc-400 hover:bg-white/5 hover:text-white",
          )}
          key={item.id}
          onClick={() => onSectionChange(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
