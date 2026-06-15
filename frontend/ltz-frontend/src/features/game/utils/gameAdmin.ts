export const ADMIN_ACTION_MESSAGE =
  "Bu işlemi yapmak için admin yetkisi gereklidir.";

export const isAdminRole = (role: string | null | undefined) => {
  const normalizedRole = role?.trim().toUpperCase();
  return normalizedRole === "ADMIN" || normalizedRole === "ROLE_ADMIN";
};
