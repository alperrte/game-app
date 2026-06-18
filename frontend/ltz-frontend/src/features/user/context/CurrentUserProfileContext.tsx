import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ApiError } from "../../../lib/axios";
import {
  clearProfileReady,
  getProfileReadyUserId,
  setProfileReady,
} from "../../../lib/token";
import { useAuthStore } from "../../../store/authStore";
import { userService } from "../services/userService";
import type { UserProfileResponse } from "../types/user";

type CurrentUserProfileContextValue = {
  profile: UserProfileResponse | null;
  loading: boolean;
  refresh: () => Promise<void>;
  hydrateProfile: (data: UserProfileResponse) => void;
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

  const hydrateProfile = useCallback(
    (data: UserProfileResponse) => {
      if (!user) return;
      setProfile(data);
      setProfileReady(user.userId);
    },
    [user],
  );

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }

    if (getProfileReadyUserId() !== user.userId) {
      setProfile(null);
      return;
    }

    setLoading(true);
    try {
      const data = await userService.getMyProfile();
      setProfile(data);
      setProfileReady(user.userId);
    } catch (err) {
      setProfile(null);
      if (err instanceof ApiError && err.status === 404) {
        clearProfileReady();
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }

    if (getProfileReadyUserId() === user.userId) {
      void refresh();
    } else {
      setProfile(null);
    }
  }, [isAuthenticated, user?.userId, refresh]);

  const value = useMemo<CurrentUserProfileContextValue>(
    () => ({
      profile,
      loading,
      refresh,
      hydrateProfile,
      displayName: profile?.displayName?.trim() || profile?.username || user?.username || "Oyuncu",
      avatarUrl: profile?.avatarUrl ?? null,
    }),
    [profile, loading, refresh, hydrateProfile, user?.username],
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
