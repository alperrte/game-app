import type { UserAuditLog } from "../types/audit";

const ACTION_LABELS: Record<string, string> = {
  CREATE_PROFILE: "Profil oluşturuldu",
  UPDATE_PROFILE: "Profil güncellendi",
  UPDATE_PRIVACY: "Gizlilik ayarları değiştirildi",
  CONNECT_ACCOUNT: "Hesap bağlandı",
  UPDATE_CONNECTED_ACCOUNT: "Bağlı hesap güncellendi",
  DISCONNECT_ACCOUNT: "Hesap bağlantısı kesildi",
};

export function getAuditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replaceAll("_", " ").toLowerCase();
}

export function formatAuditDetails(log: UserAuditLog): string {
  if (!log.details) return "İşlem tamamlandı.";

  return log.details
    .replace(/^Profile initialized for user /i, "Profil oluşturuldu: ")
    .replace(/^Profile fields updated/i, "Profil bilgileri güncellendi")
    .replace(/^Privacy settings modified/i, "Gizlilik ayarları güncellendi")
    .replace(/^Linked platform: /i, "Bağlanan platform: ")
    .replace(/^Disconnected platform: /i, "Bağlantısı kesilen platform: ");
}

export function canViewSensitiveAuditFields(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toUpperCase().replace("ROLE_", "");
  return normalized === "ADMIN" || normalized === "MODERATOR";
}
