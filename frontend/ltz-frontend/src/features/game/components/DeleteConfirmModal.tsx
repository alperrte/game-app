type DeleteConfirmModalProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  isDeleting?: boolean;
  isOpen: boolean;
  itemName?: string;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
};

const DeleteConfirmModal = ({
  cancelLabel = "Vazgeç",
  confirmLabel = "Sil",
  description,
  isDeleting = false,
  isOpen,
  itemName,
  onCancel,
  onConfirm,
  title = "Silme Onayı",
}: DeleteConfirmModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140] grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-slate-950 p-6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.55)]">
        <div className="mb-5 flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-red-400/30 bg-red-500/15 text-2xl text-red-200">
            !
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {description}
            </p>
          </div>
        </div>

        {itemName ? (
          <div className="mb-5 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm font-semibold text-white">
            {itemName}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="cursor-pointer rounded-xl border border-white/10 bg-slate-950/60 px-5 py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeleting}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="cursor-pointer rounded-xl bg-red-600 px-5 py-4 text-sm font-bold text-white shadow-xl shadow-red-950/40 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
          >
            {isDeleting ? "Siliniyor..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
};

export default DeleteConfirmModal;
