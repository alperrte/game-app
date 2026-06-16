export type UserRole = "ADMIN" | "MODERATOR" | "USER" | string;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Yönetici",
  MODERATOR: "Moderatör",
  USER: "Oyuncu",
};

export function normalizeRole(role?: string | null): string {
  return (role ?? "USER").toUpperCase().replace("ROLE_", "");
}

export function getRoleLabel(role?: string | null): string {
  const normalized = normalizeRole(role);
  return ROLE_LABELS[normalized] ?? "Oyuncu";
}

export function getRoleNameClass(role?: string | null): string {
  const normalized = normalizeRole(role);
  if (normalized === "ADMIN") return "text-emerald-400";
  if (normalized === "MODERATOR") return "text-amber-400";
  return "text-white";
}

export function getRoleBadgeClass(role?: string | null): string {
  const normalized = normalizeRole(role);
  if (normalized === "ADMIN") {
    return "border-rose-500/60 bg-gradient-to-r from-rose-600/90 to-rose-700/90 text-white";
  }
  if (normalized === "MODERATOR") {
    return "border-amber-500/50 bg-gradient-to-r from-amber-600/80 to-orange-600/80 text-white";
  }
  return "border-violet-500/40 bg-gradient-to-r from-violet-600/70 to-indigo-600/70 text-white";
}
