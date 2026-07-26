import { cn } from "../../../../utils/cn";
import type { ProfileThemeClasses } from "../../utils/theme";

export type ProfileNavSection = "wall" | "about" | "hardware" | "settings" | "reviews" | "commendations" | "clips";


const NAV_ITEMS: { id: ProfileNavSection; label: string }[] = [
  { id: "wall", label: "Duvar" },
  { id: "clips", label: "Klipler" },
  { id: "commendations", label: "Takdirler (+Rep)" },
  { id: "reviews", label: "İncelemeler" },
  { id: "about", label: "Hakkında" },
  { id: "hardware", label: "Donanım" },
];


type ProfileQuickNavProps = {
  theme?: ProfileThemeClasses;
  activeSection: ProfileNavSection;
  showHardware: boolean;
  onSectionChange: (section: ProfileNavSection) => void;
};

export function ProfileQuickNav({
  theme,
  activeSection,
  showHardware,
  onSectionChange,
}: ProfileQuickNavProps) {
  const visibleItems = NAV_ITEMS.filter((item) => item.id !== "hardware" || showHardware);

  return (
    <nav className={cn("flex flex-wrap items-center gap-2 rounded-2xl border bg-zinc-950/90 p-2 shadow-lg backdrop-blur-md", theme ? theme.border : "border-violet-500/20")}>
      {visibleItems.map((item) => (
        <button
          className={cn(
            "rounded-xl px-5 py-2.5 text-sm font-bold transition duration-200 cursor-pointer",
            activeSection === item.id
              ? cn("text-white bg-violet-600 shadow-lg", theme ? theme.glow : "shadow-[0_0_20px_rgba(124,58,237,0.35)]")
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
