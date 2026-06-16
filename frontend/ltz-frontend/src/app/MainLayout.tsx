import { Outlet, useLocation } from "react-router-dom";
import GameNavbar from "../features/game/components/GameNavbar";

/*
 * MainLayout: Login / register dışındaki ana uygulama ekranlarının ortak kabuğu.
 * Giriş sonrası sayfalar bu layout içindeki <Outlet /> alanında açılır.
 *
 * Game-service sayfalarında da artık ortak GameNavbar kullanılır.
 */

export function MainLayout() {
  const location = useLocation();

  const getActiveItem = () => {
    const path = location.pathname;
    if (path === "/") return "Feed";
    if (path.startsWith("/games/categories")) return "Categories";
    if (path.startsWith("/games/platforms")) return "Platforms";
    if (path.startsWith("/games/developers")) return "Developers";
    if (path.startsWith("/games/publishers")) return "Publishers";
    if (path.startsWith("/games/system-requirements")) return "SystemRequirements";
    if (path === "/games" || path.startsWith("/games/")) return "Games";
    if (path.startsWith("/profile")) return "Profile";
    return "Games";
  };

  return (
    <div className="min-h-screen bg-ltz-bg text-white">
      <GameNavbar activeItem={getActiveItem()} />

      <main className="min-h-[calc(100vh-80px)]">
        <Outlet />
      </main>
    </div>
  );
}
