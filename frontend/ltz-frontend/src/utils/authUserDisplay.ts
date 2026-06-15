import type { AuthUser } from "../features/auth/types/auth.types";

const roleLabels: Record<string, string> = {
  ADMIN: "Yönetici",
  DEVELOPER: "Geliştirici",
  USER: "Kullanıcı",
};

export function getUserDisplayName(user: AuthUser | null): string {
  return user?.username || user?.email || "Kullanıcı";
}

export function getUserRoleLabel(user: AuthUser | null): string | null {
  if (!user?.role) {
    return null;
  }

  return roleLabels[user.role.toUpperCase()] ?? user.role;
}

export function getUserInitials(user: AuthUser | null): string {
  const displayName = getUserDisplayName(user).trim();

  if (!displayName) {
    return "K";
  }

  const nameParts = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (nameParts.length > 1) {
    return nameParts.map((part) => part[0]).join("").toUpperCase();
  }

  return displayName[0].toUpperCase();
}
