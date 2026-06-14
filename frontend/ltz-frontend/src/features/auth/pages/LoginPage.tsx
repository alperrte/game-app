/*
 * LTZ Login sayfası.
 *
 * Kompozisyon (xl ve üstü):
 *   [ LTZ karakter + şehir arka planı ]  [ Feature Cards ]  [ Login Form paneli ]
 *
 * Arka plan + HUD öğeleri AuthBackdrop içinde paylaşılır.
 */

import { Card } from "../../../components/ui/Card";
import { AuthBackdrop } from "../components/AuthBackdrop";
import { FeatureCards } from "../components/FeatureCards";
import { LoginForm } from "../components/LoginForm";
import { LoginHud } from "../components/LoginHud";

export function LoginPage() {
    return (
        <AuthBackdrop>
            <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-8 px-6 py-16 xl:grid-cols-[1fr_420px_minmax(0,520px)] xl:gap-10">
                {/* Sol kolon: karakterin görünür kalması için boş bırakılır */}
                <div className="hidden xl:block" aria-hidden="true" />

                {/* Orta kolon: feature kartları */}
                <div className="flex justify-center xl:justify-start">
                    <FeatureCards />
                </div>

                {/* Sağ kolon: login paneli */}
                <div className="mx-auto w-full max-w-md xl:mx-0">
                    <Card className="p-7 sm:p-9">
                        <LoginForm />

                        <div className="mt-7 border-t border-white/10 pt-5">
                            <LoginHud />
                        </div>
                    </Card>
                </div>
            </div>
        </AuthBackdrop>
    );
}
