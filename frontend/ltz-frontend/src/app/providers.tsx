import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "../components/ui/Toast";

/*
 * Uygulama genelinde kullanılan sağlayıcıların toplandığı dosya.
 * Şimdilik router sağlayıcısı (BrowserRouter) bulunur.
 * İleride tema, bildirim, query client gibi sağlayıcılar buraya eklenebilir.
 */

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <ToastProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </ToastProvider>
  );
};