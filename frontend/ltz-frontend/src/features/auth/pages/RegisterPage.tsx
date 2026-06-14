/*
 * LTZ Register sayfası.
 * Login ile aynı atmosferi (AuthBackdrop) paylaşır; sağda tek bir kayıt paneli gösterir.
 */

import { Card } from "../../../components/ui/Card";
import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
    return (
        <div className="mx-auto flex min-h-screen items-center justify-center px-6 py-10">
            <div className="w-full max-w-[480px]">
                <Card className="login-panel flex min-h-[40rem] flex-col px-8 py-9 sm:px-11 sm:py-9">
                    <RegisterForm />
                </Card>
            </div>
        </div>
    );
}
