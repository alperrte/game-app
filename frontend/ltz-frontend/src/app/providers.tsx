/*
 * Uygulama genelinde kullanılan sağlayıcıların toplandığı dosya.
 * Şimdilik yalnızca router sağlayıcısı (BrowserRouter) bulunur.
 * İleride tema, bildirim, query client gibi sağlayıcılar buraya eklenebilir.
 */

import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return <BrowserRouter>{children}</BrowserRouter>;
}
