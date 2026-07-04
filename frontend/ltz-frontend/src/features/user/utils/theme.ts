export type ProfileThemeClasses = {
  text: string;
  border: string;
  bg: string;
  glow: string;
  gradient: string;
  borderHover: string;
  bgHover: string;
};

export const getThemeClasses = (theme: string | null | undefined): ProfileThemeClasses => {
  switch (theme) {
    case "NEON_PINK":
      return {
        text: "text-fuchsia-400",
        border: "border-fuchsia-500/20",
        bg: "bg-fuchsia-500/10",
        glow: "shadow-[0_0_20px_rgba(240,46,170,0.25)]",
        gradient: "from-fuchsia-500 via-pink-500 to-rose-500",
        borderHover: "hover:border-fuchsia-500/40",
        bgHover: "hover:bg-fuchsia-500/5",
      };
    case "CYBERPUNK":
      return {
        text: "text-yellow-400",
        border: "border-yellow-500/20",
        bg: "bg-yellow-500/10",
        glow: "shadow-[0_0_20px_rgba(234,179,8,0.25)]",
        gradient: "from-yellow-500 via-amber-500 to-orange-500",
        borderHover: "hover:border-yellow-500/40",
        bgHover: "hover:bg-yellow-500/5",
      };
    case "MATRIX_GREEN":
      return {
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        bg: "bg-emerald-500/10",
        glow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
        gradient: "from-emerald-500 via-green-500 to-teal-500",
        borderHover: "hover:border-emerald-500/40",
        bgHover: "hover:bg-emerald-500/5",
      };
    case "STEALTH":
      return {
        text: "text-zinc-300",
        border: "border-zinc-700/30",
        bg: "bg-zinc-800/10",
        glow: "shadow-[0_0_20px_rgba(113,113,122,0.15)]",
        gradient: "from-zinc-600 via-zinc-800 to-slate-900",
        borderHover: "hover:border-zinc-600/40",
        bgHover: "hover:bg-zinc-800/5",
      };
    default:
      return {
        text: "text-violet-400",
        border: "border-violet-500/15",
        bg: "bg-violet-500/10",
        glow: "shadow-[0_0_20px_rgba(139,92,246,0.25)]",
        gradient: "from-violet-500 via-fuchsia-500 to-cyan-500",
        borderHover: "hover:border-violet-500/40",
        bgHover: "hover:bg-violet-500/5",
      };
  }
};
