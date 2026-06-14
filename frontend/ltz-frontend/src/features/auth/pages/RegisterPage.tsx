/*
 * LTZ Register sayfası.
 * Login ile aynı atmosferi (AuthBackdrop) paylaşır; sağda tek bir kayıt paneli gösterir.
 */

import { Card } from "../../../components/ui/Card";
import { AuthBackdrop } from "../components/AuthBackdrop";
import { LoginHud } from "../components/LoginHud";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
    return (
        <AuthBackdrop>
            <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-16 xl:justify-end">
                <div className="w-full max-w-md">
                    <Card className="p-7 sm:p-9">
                        <RegisterForm />

                        <div className="mt-7 border-t border-white/10 pt-5">
                            <LoginHud />
                        </div>
                    </Card>
                </div>
            </div>
        </AuthBackdrop>
    );
}
