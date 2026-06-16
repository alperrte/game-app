export const BIO_MAX_LENGTH = 280;

export type UserAuditLog = {
  id: number;
  action: string;
  details: string | null;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
};
