import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";

/*
 * Giriş yapılmış kullanıcıların ortak kabuğu.
 * Sabit (sticky) genel Navbar + sayfa içeriği.
 * Her sayfa kendi <main> kapsayıcısını sağlar; burada sadece geçiş animasyonu sarmalayıcısı bulunur.
 */
export function MainLayout() {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-ltz-bg text-white">
            <Navbar />
            <div className="ltz-page-transition" key={location.pathname}>
                <Outlet />
            </div>
        </div>
    );
}
