export type ProfileSectionVisibility = {
  showHardware: boolean;
  showFriendList: boolean;
  showFollowerList: boolean;
  showLastSeen: boolean;
  showGameLibrary: boolean;
};

export type AssignedBadgeResponse = {
  badgeKey: string;
  label: string;
  assignedBy: string;
  assignedAt: string;
};

export type BadgeCatalogItem = {
  badgeKey: string;
  label: string;
};

export type UserProfileResponse = {
  userId: string;
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  gamerType: string | null;
  favoriteCategories: string | null;
  profileThemeUrl: string | null;
  profileBackgroundUrl: string | null;
  profileMusicUrl: string | null;
  hardwareCpu: string | null;
  hardwareGpu: string | null;
  hardwareRam: string | null;
  hardwareOs: string | null;
  connectedAccounts?: ConnectedAccountResponse[];
  role?: string | null;
  lastSeenAt?: string | null;
  sectionVisibility?: ProfileSectionVisibility | null;
  assignedBadges?: AssignedBadgeResponse[] | null;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileRequest = {
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  gamerType?: string | null;
  favoriteCategories?: string | null;
  profileThemeUrl?: string | null;
  profileBackgroundUrl?: string | null;
  profileMusicUrl?: string | null;
  hardwareCpu?: string | null;
  hardwareGpu?: string | null;
  hardwareRam?: string | null;
  hardwareOs?: string | null;
};

export type VisibilityLevel = "PUBLIC" | "FRIENDS_ONLY" | "PRIVATE";

export type PrivacySettingsResponse = {
  userId: string;
  profileVisibility: VisibilityLevel;
  gameLibraryVisibility: VisibilityLevel;
  hardwareVisibility: VisibilityLevel;
  friendListVisibility: VisibilityLevel;
  followerListVisibility: VisibilityLevel;
  lastSeenVisibility: VisibilityLevel;
};

export type PrivacySettingsRequest = {
  profileVisibility?: VisibilityLevel;
  gameLibraryVisibility?: VisibilityLevel;
  hardwareVisibility?: VisibilityLevel;
  friendListVisibility?: VisibilityLevel;
  followerListVisibility?: VisibilityLevel;
  lastSeenVisibility?: VisibilityLevel;
};

export type ConnectedAccountResponse = {
  id: number;
  userId: string;
  platformName: string;
  platformUserId: string;
  platformUsername: string | null;
  connectedAt: string;
};

export type ConnectedAccountRequest = {
  platformName: string;
  platformUserId: string;
  platformUsername?: string | null;
};

export type AssignBadgeRequest = {
  badgeKey: string;
  label: string;
};

export { BIO_MAX_LENGTH } from "./audit";
export type { UserAuditLog } from "./audit";
