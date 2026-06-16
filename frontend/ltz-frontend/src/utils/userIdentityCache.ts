import { STORAGE_KEYS } from "../lib/constants";

export function readUserIdentityCache(): Map<number, string> {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEYS.userIdentityCache);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : {};

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      return new Map();
    }

    return new Map(
      Object.entries(parsedValue)
        .map(([userId, username]) => [Number(userId), username] as const)
        .filter(
          (entry): entry is readonly [number, string] =>
            Number.isFinite(entry[0]) && typeof entry[1] === "string",
        ),
    );
  } catch {
    return new Map();
  }
}

export function cacheUserIdentity(userId: number, username: string): void {
  try {
    const cache = readUserIdentityCache();
    cache.set(userId, username);
    localStorage.setItem(
      STORAGE_KEYS.userIdentityCache,
      JSON.stringify(Object.fromEntries(cache)),
    );
  } catch {
    // localStorage kullanılamıyorsa akışı bozma.
  }
}

export function resolveUserDisplayName(
  userId: number,
  profiles = new Map<number, { displayName?: string | null; username: string }>(),
  cachedUsernames = readUserIdentityCache(),
  currentUserId?: number,
  currentUsername?: string,
): string {
  if (currentUserId === userId && currentUsername) {
    return currentUsername;
  }

  const profile = profiles.get(userId);

  if (profile) {
    return profile.displayName?.trim() || profile.username;
  }

  const cachedUsername = cachedUsernames.get(userId);

  if (cachedUsername) {
    return cachedUsername;
  }

  return `Kullanıcı #${userId}`;
}
