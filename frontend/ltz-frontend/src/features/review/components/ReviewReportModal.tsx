import { useState, type FormEvent } from "react";

type ReviewReportModalProps = {
    open: boolean;
    submitting?: boolean;
    errorMessage?: string | null;
    onClose: () => void;
    onSubmit: (reason: string) => Promise<void>;
};

export function ReviewReportModal({
                                      open,
                                      submitting = false,
                                      errorMessage,
                                      onClose,
                                      onSubmit,
                                  }: ReviewReportModalProps) {
    const [reason, setReason] = useState("");

    if (!open) {
        return null;
    }

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!reason.trim()) {
            return;
        }

        await onSubmit(reason.trim());
        setReason("");
    };

    const handleClose = () => {
        if (submitting) {
            return;
        }

        setReason("");
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-5">
                    <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                        İncelemeyi şikayet et
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Bu incelemeyle ilgili problemi kısaca açıkla. Moderasyon ekibi
                        değerlendirecek.
                    </p>
                </div>

                {errorMessage && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Şikayet sebebi
            </span>
                        <textarea
                            rows={5}
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            placeholder="Örn: Hakaret içeriyor, spam, yanıltıcı bilgi..."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                        />
                    </label>

                    <div className="mt-5 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={submitting}
                            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900"
                        >
                            Vazgeç
                        </button>

                        <button
                            type="submit"
                            disabled={submitting || !reason.trim()}
                            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Gönderiliyor..." : "Şikayet gönder"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}