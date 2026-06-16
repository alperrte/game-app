import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuthStore } from "../../../store/authStore";
import { userService } from "../services/userService";
import type { UserProfileResponse } from "../types/user";

type CurrentUserProfileContextValue = {
  profile: UserProfileResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  displayName: string;
  avatarUrl: string | null;
};

const CurrentUserProfileContext = createContext<CurrentUserProfileContextValue | null>(
  null,
);

export function CurrentUserProfileProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }

    setLoading(true);
    try {
      const data = await userService.getMyProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    void Promise.resolve().then(() => refresh());
  }, [refresh]);

  const value = useMemo<CurrentUserProfileContextValue>(
    () => ({
      profile,
      loading,
      refresh,
      displayName: profile?.displayName?.trim() || profile?.username || user?.username || "Oyuncu",
      avatarUrl: profile?.avatarUrl ?? null,
    }),
    [profile, loading, refresh, user?.username],
  );

  return (
    <CurrentUserProfileContext.Provider value={value}>
      {children}
    </CurrentUserProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUserProfile() {
  const context = useContext(CurrentUserProfileContext);
  if (!context) {
    throw new Error("useCurrentUserProfile must be used within CurrentUserProfileProvider");
  }
  return context;
}
