import { Outlet } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";

/*
 * Giriş yapılmış kullanıcıların ortak kabuğu.
 * Sabit (sticky) genel Navbar + sayfa içeriği.
 * Her sayfa kendi <main> kapsayıcısını sağlar; burada ek sarmalayıcı yoktur.
 */
export function MainLayout() {
    return (
        <div className="min-h-screen bg-ltz-bg text-white">
            <Navbar />
            <Outlet />
        </div>
    );
}
