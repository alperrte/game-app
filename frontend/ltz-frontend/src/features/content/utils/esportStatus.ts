import type { EsportMatch } from "../types/esport.types";

export function esportStatusLabel(status: EsportMatch["status"]): string {
    if (status === "LIVE") return "Canlı";
    if (status === "UPCOMING") return "Yakında";
    return "Bitti";
}

export function esportStatusTone(status: EsportMatch["status"]): string {
    if (status === "LIVE") {
        return "border-rose-400/40 bg-rose-500/15 text-rose-200";
    }
    if (status === "UPCOMING") {
        return "border-violet-400/30 bg-violet-500/10 text-violet-200";
    }
    return "border-white/10 bg-white/[0.04] text-slate-300";
}
