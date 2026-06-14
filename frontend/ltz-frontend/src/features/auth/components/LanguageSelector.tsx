/*
 * Sağ üst köşedeki dil seçici (UI-only).
 * Varsayılan dil: Türkçe. Gerçek i18n entegrasyonu bu görevin kapsamı dışındadır.
 */

import { ChevronDown, Globe } from "lucide-react";

export function LanguageSelector() {
    return (
        <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-zinc-200 backdrop-blur-xl transition-colors hover:border-fuchsia-400/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60"
            // TODO: Dil değiştirme (i18n) ileride eklenecek.
        >
            <Globe size={15} className="text-fuchsia-300" />
            Türkçe
            <ChevronDown size={14} className="text-zinc-400" />
        </button>
    );
}
