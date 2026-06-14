/*
 * LTZ Register sayfası.
 *
 * Sayfa iskeleti (arka plan, feature kartları ve sabit auth kartı) AuthLayout
 * tarafından sağlanır. Bu sayfa yalnızca kartın içine giren kayıt formunu render eder;
 * böylece login <-> register geçişinde kart sabit kalır, sadece form animasyonla değişir.
 */

import { RegisterForm } from "../components/RegisterForm";

export function RegisterPage() {
    return <RegisterForm />;
}
