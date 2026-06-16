import { createPortal } from "react-dom";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Evet, paylaş",
  cancelLabel = "Vazgeç",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl border border-white/10 bg-[#0a101c] p-6 shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h2 className="text-lg font-black text-white" id="confirm-modal-title">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="h-10 cursor-pointer rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="h-10 cursor-pointer rounded-lg bg-violet-700 px-4 text-sm font-bold text-white transition hover:bg-violet-600"
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
