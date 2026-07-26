import { useEffect, type ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "../components/ui/Toast";
import { CurrentUserProfileProvider, useCurrentUserProfile } from "../features/user/context/CurrentUserProfileContext";

/*
 * Uygulama genelinde kullanılan sağlayıcıların toplandığı dosya.
 * Şimdilik router sağlayıcısı (BrowserRouter) bulunur.
 * İleride tema, bildirim, query client gibi sağlayıcılar buraya eklenebilir.
 */

type AppProvidersProps = {
  children: ReactNode;
};

const GlobalThemeSync = () => {
  const { profile } = useCurrentUserProfile();

  useEffect(() => {
    const theme = profile?.profileThemeUrl || "DEFAULT";
    document.documentElement.setAttribute("data-theme", theme);
  }, [profile?.profileThemeUrl]);

  return null;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <CurrentUserProfileProvider>
          <GlobalThemeSync />
          {children}
        </CurrentUserProfileProvider>
      </BrowserRouter>
    </ToastProvider>
  );
};