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
};

export type PrivacySettingsRequest = {
  profileVisibility?: VisibilityLevel;
  gameLibraryVisibility?: VisibilityLevel;
  hardwareVisibility?: VisibilityLevel;
  friendListVisibility?: VisibilityLevel;
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

export type UserAuditLog = {
  id: number;
  userId: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
};
