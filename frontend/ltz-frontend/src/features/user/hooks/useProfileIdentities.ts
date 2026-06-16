import { useCallback, useRef } from "react";
import { STORAGE_KEYS } from "../../../lib/constants";
import { userService } from "../services/userService";
import type { UserProfileResponse } from "../types/user";

export type ProfileIdentity = {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

type IdentityMap = Map<number, ProfileIdentity>;

const MAX_BATCH_SIZE = 50;
const CACHE_TTL_MS = 1000 * 60 * 30;

type CachedIdentityEntry = ProfileIdentity & { cachedAt: number };

function readIdentityCache(): IdentityMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.userIdentityCache);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new Map();
    }

    const now = Date.now();
    const result = new Map<number, ProfileIdentity>();

    for (const [id, value] of Object.entries(parsed)) {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) continue;

      if (typeof value === "string") {
        result.set(numericId, {
          userId: numericId,
          username: value,
          displayName: value,
          avatarUrl: null,
        });
        continue;
      }

      if (!value || typeof value !== "object") continue;
      const entry = value as Partial<CachedIdentityEntry>;
      if (typeof entry.username !== "string") continue;
      if (entry.cachedAt && now - entry.cachedAt > CACHE_TTL_MS) continue;

      result.set(numericId, {
        userId: numericId,
        username: entry.username,
        displayName: entry.displayName?.trim() || entry.username,
        avatarUrl: entry.avatarUrl ?? null,
      });
    }

    return result;
  } catch {
    return new Map();
  }
}

function writeIdentityCache(identities: IdentityMap) {
  try {
    const obj: Record<string, CachedIdentityEntry> = {};
    const cachedAt = Date.now();
    identities.forEach((value, key) => {
      obj[String(key)] = { ...value, cachedAt };
    });
    localStorage.setItem(STORAGE_KEYS.userIdentityCache, JSON.stringify(obj));
  } catch {
    // ignore cache write issues
  }
}

function toIdentity(profile: UserProfileResponse): ProfileIdentity | null {
  const id = Number(profile.userId);
  if (!Number.isFinite(id)) return null;
  return {
    userId: id,
    username: profile.username,
    displayName: profile.displayName?.trim() || profile.username,
    avatarUrl: profile.avatarUrl,
  };
}

export function useProfileIdentities() {
  const cacheRef = useRef<IdentityMap>(readIdentityCache());

  const resolveIdentities = useCallback(async (ids: Array<number | string>) => {
    const normalized = Array.from(
      new Set(
        ids
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value)),
      ),
    );

    if (normalized.length === 0) return new Map<number, ProfileIdentity>();

    const fromCache = new Map<number, ProfileIdentity>();
    const missing: number[] = [];

    normalized.forEach((id) => {
      const cached = cacheRef.current.get(id);
      if (cached) {
        fromCache.set(id, cached);
      } else {
        missing.push(id);
      }
    });

    if (missing.length === 0) return fromCache;

    const batches: number[][] = [];
    for (let index = 0; index < missing.length; index += MAX_BATCH_SIZE) {
      batches.push(missing.slice(index, index + MAX_BATCH_SIZE));
    }

    const nextMap = new Map(fromCache);

    for (const batch of batches) {
      try {
        const profiles = await userService.getProfilesBatch(batch.map(String));
        profiles.forEach((profile) => {
          const identity = toIdentity(profile);
          if (!identity) return;
          nextMap.set(identity.userId, identity);
          cacheRef.current.set(identity.userId, identity);
        });
      } catch {
        // keep partial cache on batch failure
      }
    }

    writeIdentityCache(cacheRef.current);
    return nextMap;
  }, []);

  return { resolveIdentities };
}
