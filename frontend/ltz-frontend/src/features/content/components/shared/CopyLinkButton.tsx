import { Link2 } from "lucide-react";

import { cn } from "../../../../utils/cn";
import { useToast } from "../../../../components/ui/toastContext";

interface CopyLinkButtonProps {
    url: string;
    className?: string;
}

export function CopyLinkButton({ url, className }: CopyLinkButtonProps) {
    const { showToast } = useToast();

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(url);
            showToast("Bağlantı kopyalandı.", "success");
        } catch {
            showToast("Bağlantı kopyalanamadı.", "error");
        }
    }

    return (
        <button
            type="button"
            aria-label="Bağlantıyı kopyala"
            onClick={() => void handleCopy()}
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-violet-400/30 hover:text-white",
                className,
            )}
        >
            <Link2 size={13} />
            Kopyala
        </button>
    );
}
