/*
 * LTZ Login sayfası.
 *
 * Kompozisyon (xl ve üstü):
 *   [ LTZ karakter + şehir arka planı ]  [ Feature Cards ]  [ Login Form paneli ]
 *
 * Arka plan + HUD öğeleri AuthBackdrop içinde paylaşılır.
 */

import { Card } from "../../../components/ui/Card";
import { FeatureCards } from "../components/FeatureCards";
import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
    return (
        <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-8 px-6 py-16 xl:grid-cols-[1fr_420px_minmax(0,520px)] xl:gap-10">
            {/* Sol kolon: karakterin görünür kalması için boş bırakılır */}
            <div className="hidden xl:block" aria-hidden="true" />

            {/* Orta kolon: feature kartları */}
            <div className="flex justify-center xl:justify-start">
                <FeatureCards />
            </div>

            {/* Sağ kolon: login paneli */}
            <div className="mx-auto w-full max-w-[480px] xl:mx-0">
                <Card className="login-panel flex min-h-[40rem] flex-col px-8 py-9 sm:px-11 sm:py-9">
                    <LoginForm />
                </Card>
            </div>
        </div>
    );
}
