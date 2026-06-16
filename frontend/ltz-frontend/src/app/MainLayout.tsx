```tsx
import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";
import GameNavbar from "../features/game/components/GameNavbar";

/*
 * MainLayout: Giriş sonrası ana uygulama ekranlarının ortak kabuğu.
 *
 * Game-service sayfalarında GameNavbar,
 * diğer uygulama sayfalarında genel Navbar kullanılır.
 *
 * Sayfa içerikleri <Outlet /> alanında açılır ve
 * route değişimlerinde geçiş animasyonu uygulanır.
 */
export function MainLayout() {
  const location = useLocation();
  const path = location.pathname;

  const isGamePage = path === "/games" || path.startsWith("/games/");

  const getActiveItem = () => {
    if (path === "/") return "Feed";
    if (path.startsWith("/messages")) return "Messages";
    if (path.startsWith("/games/categories")) return "Categories";
    if (path.startsWith("/games/platforms")) return "Platforms";
    if (path.startsWith("/games/developers")) return "Developers";
    if (path.startsWith("/games/publishers")) return "Publishers";

    if (path.startsWith("/games/system-requirements")) {
      return "SystemRequirements";
    }

    if (isGamePage) return "Games";
    if (path.startsWith("/profile")) return "Profile";

    return "Games";
  };

  return (
    <div className="min-h-screen bg-ltz-bg text-white">
      {isGamePage ? (
        <GameNavbar activeItem={getActiveItem()} />
      ) : (
        <Navbar />
      )}

      <div
        className="ltz-page-transition"
        key={location.pathname}
      >
        <Outlet />
      </div>
    </div>
  );
}
```
