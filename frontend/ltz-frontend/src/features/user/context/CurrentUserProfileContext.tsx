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
      setProfileReady(String(user.userId));
    },
    [user],
  );

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      return;
    }

    setLoading(true);
    try {
      const data = await userService.getMyProfile();
      setProfile(data);
      setProfileReady(String(user.userId));
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
      if (profile !== null) {
        setTimeout(() => setProfile(null), 0);
      }
      return;
    }

    // profile'ın zaten yüklü olup olmadığını ve doğru kullanıcıya ait olup olmadığını kontrol ediyoruz
    const profileReadyId = getProfileReadyUserId();
    const currentUserIdStr = String(user.userId);

    if (profileReadyId === currentUserIdStr) {
      // Eğer profil zaten güncelse ve state boşsa (örn. ilk açılışta veya cache'den) çekelim
      if (profile === null) {
        setTimeout(() => {
          void refresh();
        }, 0);
      }
    } else {
      // Başka bir kullanıcı giriş yaptıysa veya hazır değilse sıfırlayıp çekelim
      setTimeout(() => {
        setProfile(null);
        void refresh();
      }, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.userId, refresh]); // <-- Bağımlılıklardan profile ve tüm user nesnesi çıkarıldı (sadece userId eklendi)




  const value = useMemo<CurrentUserProfileContextValue>(
    () => ({
      profile,
      loading,
      refresh,
      hydrateProfile,
      displayName: profile?.displayName?.trim() || profile?.username || user?.username || "Oyuncu",
      avatarUrl: profile?.avatarUrl ?? null,
    }),
    [profile, loading, refresh, hydrateProfile, user], // <-- user?.username yerine user yazdık
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
