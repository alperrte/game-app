import React, { useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "ltz-profile-dev-note-dismissed";

export const ProfileDevNote: React.FC = () => {
  const [visible, setVisible] = useState(() => localStorage.getItem(STORAGE_KEY) !== "1");

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-xs rounded-xl border border-amber-500/30 bg-zinc-950/95 px-4 py-3 text-[11px] leading-relaxed text-zinc-300 shadow-lg">
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setVisible(false);
        }}
        className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
        aria-label="Kapat"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <p className="pr-5 italic text-amber-200/90">
        user trafında gif fazla yer kaplıyo eğer premium falan olursa düşünürz oraları — kerem kamyoncu
      </p>
    </div>
  );
};
