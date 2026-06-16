import type { AssignedBadgeResponse, ConnectedAccountResponse, UserProfileResponse } from "../types/user";

export type ProfileBadge = {
  id: string;
  label: string;
};

type BuildBadgeParams = {
  profile: UserProfileResponse;
  followerCount: number;
  friendCount: number;
  isOwnProfile: boolean;
};

function hasPlatform(
  accounts: ConnectedAccountResponse[] | undefined,
  platform: string,
): boolean {
  return Boolean(
    accounts?.some((account) => account.platformName.toUpperCase() === platform),
  );
}

export function buildProfileBadges({
  profile,
  followerCount,
  friendCount,
  isOwnProfile,
}: BuildBadgeParams): ProfileBadge[] {
  const badges: ProfileBadge[] = [];
  const createdAt = new Date(profile.createdAt).getTime();
  const pioneerCutoff = new Date("2026-01-01T00:00:00Z").getTime();

  if (Number.isFinite(createdAt) && createdAt <= pioneerCutoff) {
    badges.push({ id: "pioneer", label: "Öncü" });
  }

  if (hasPlatform(profile.connectedAccounts, "STEAM")) {
    badges.push({ id: "steam", label: "Steam Bağlı" });
  }

  if (hasPlatform(profile.connectedAccounts, "DISCORD")) {
    badges.push({ id: "discord", label: "Discord Bağlı" });
  }

  if (profile.profileMusicUrl?.trim()) {
    badges.push({ id: "audiophile", label: "Müzikçi" });
  }

  if (profile.profileBackgroundUrl?.trim()) {
    badges.push({ id: "customizer", label: "Özelleştirici" });
  }

  if (followerCount >= 100) {
    badges.push({ id: "influencer", label: "Etkileyici" });
  }

  if (friendCount >= 25) {
    badges.push({ id: "connector", label: "Bağlantı Ustası" });
  }

  if (isOwnProfile) {
    badges.push({ id: "owner", label: "Profil Sahibi" });
  }

  return badges;
}

export function mergeAssignedBadges(
  automatic: ProfileBadge[],
  assigned?: AssignedBadgeResponse[] | null,
): ProfileBadge[] {
  if (!assigned?.length) return automatic;

  const assignedBadges: ProfileBadge[] = assigned.map((badge) => ({
    id: `assigned-${badge.badgeKey}`,
    label: badge.label,
  }));

  const automaticIds = new Set(assigned.map((badge) => badge.badgeKey));
  const filteredAutomatic = automatic.filter((badge) => !automaticIds.has(badge.id));

  return [...assignedBadges, ...filteredAutomatic];
}
