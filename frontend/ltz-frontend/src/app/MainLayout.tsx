import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";
import { FloatingChatWidget } from "../features/social/components/FloatingChatWidget";
import { ChatWidgetProvider } from "../features/social/context/ChatWidgetContext";

/*
 * MainLayout: Giriş sonrası ana uygulama ekranlarının ortak kabuğu.
 *
 * Tüm giriş sonrası sayfalarda ortak Navbar kullanılır.
 * Sayfa içerikleri <Outlet /> alanında açılır ve
 * route değişimlerinde geçiş animasyonu uygulanır.
 */
export function MainLayout() {
  const location = useLocation();

  return (
    <ChatWidgetProvider>
      <div className="min-h-screen bg-ltz-bg text-white">
        <Navbar />

        <div
            className="ltz-page-transition"
            key={location.pathname}
        >
          <Outlet />
        </div>
        <FloatingChatWidget />
      </div>
    </ChatWidgetProvider>
  );
}

export default MainLayout;
