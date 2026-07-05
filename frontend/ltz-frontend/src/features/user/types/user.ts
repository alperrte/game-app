export type ProfileSectionVisibility = {
  showHardware: boolean;
  showFriendList: boolean;
  showFollowerList: boolean;
  showLastSeen: boolean;
  showGameLibrary: boolean;
};

export type ReviewClientResponse = {
  id: number;
  gameSource: string;
  gameId: number;
  externalGameId: string;
  userId: number;
  rating: number;
  reviewText: string;
  recommended: boolean;
  playtimeHours: number;
  platform: string;
  likeCount: number;
  createdAt: string;
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

export type UserProfileReviewResponse = {
  id: number;
  reviewerId: string;
  reviewerUsername: string;
  reviewerDisplayName: string | null;
  reviewerAvatarUrl: string | null;
  reviewedId: string;
  content: string;
  friendlyPoint: boolean;
  leaderPoint: boolean;
  aimGodPoint: boolean;
  tacticianPoint: boolean;
  reported?: boolean;
  reportReason?: string | null;
  createdAt: string;
};


export type CreateProfileReviewRequest = {
  content: string;
  friendlyPoint: boolean;
  leaderPoint: boolean;
  aimGodPoint: boolean;
  tacticianPoint: boolean;
};

export type UserProfileCommendationsSummary = {
  totalReviews: number;
  friendlyCount: number;
  leaderCount: number;
  aimGodCount: number;
  tacticianCount: number;
};

export type UserProfileClipResponse = {
  id: number;
  userId: string;
  title: string;
  videoUrl: string;
  platform: "YOUTUBE" | "TWITCH";
  createdAt: string;
};

