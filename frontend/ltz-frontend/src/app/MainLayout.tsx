import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";

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
      <div className="min-h-screen bg-ltz-bg text-white">
        <Navbar />

        <div
            className="ltz-page-transition"
            key={location.pathname}
        >
          <Outlet />
        </div>
      </div>
  );
}

export default MainLayout;