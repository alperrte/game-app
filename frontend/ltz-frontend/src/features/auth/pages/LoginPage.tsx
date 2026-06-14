/*
 * LTZ Login sayfası.
 *
 * Sayfa iskeleti (arka plan, feature kartları ve sabit auth kartı) AuthLayout
 * tarafından sağlanır. Bu sayfa yalnızca kartın içine giren login formunu render eder;
 * böylece login <-> register geçişinde kart sabit kalır, sadece form animasyonla değişir.
 */

import { LoginForm } from "../components/LoginForm";

export function LoginPage() {
    return <LoginForm />;
}
