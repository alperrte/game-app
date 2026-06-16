import React, { useState, useCallback, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { ToastContext, type ToastItem, type ToastType } from "./toastContext";

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]";
      case "error":
        return "border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.25)]";
      case "info":
      default:
        return "border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.25)]";
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-rose-400" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-violet-400" />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 80, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border bg-zinc-950/90 backdrop-blur-md text-zinc-100 ${getBorderColor(
                toast.type
              )}`}
            >
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">{getIcon(toast.type)}</div>
                <p className="text-sm font-medium leading-relaxed tracking-wide select-none">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-zinc-400 hover:text-white transition-colors duration-150 rounded-lg p-0.5 hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
