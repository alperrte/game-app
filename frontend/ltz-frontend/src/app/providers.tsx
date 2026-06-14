import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

/*
 * Uygulama genelinde kullanılan sağlayıcıların toplandığı dosya.
 * Şimdilik router sağlayıcısı (BrowserRouter) bulunur.
 * İleride tema, bildirim, query client gibi sağlayıcılar buraya eklenebilir.
 */

type AppProvidersProps = {
  children: ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};