import type { GameSource } from "../types/externalGame.types";

export function getSteamHeaderImageUrl(externalId: string): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${externalId}/header.jpg`;
}

export function getExternalGameImageUrl({
  coverImageUrl,
  externalId,
  source,
}: {
  coverImageUrl: string | null;
  externalId: string;
  source: GameSource;
}): string | null {
  if (source === "STEAM" && externalId) {
    return getSteamHeaderImageUrl(externalId);
  }

  return coverImageUrl;
}
