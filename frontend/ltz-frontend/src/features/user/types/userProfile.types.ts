export interface UserProfile {
  userId: string;
  username: string;
  email: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  gamerType: string | null;
  favoriteCategories: string | null;
  profileThemeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
