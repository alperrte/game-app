import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { UserAvatar } from "../UserAvatar";
import type { ProfileIdentity } from "../../hooks/useProfileIdentities";

type ProfileConnectionListModalProps = {
  open: boolean;
  title: string;
  identities: Map<number, ProfileIdentity>;
  onClose: () => void;
};

export function ProfileConnectionListModal({
  open,
  title,
  identities,
  onClose,
}: ProfileConnectionListModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) {
      void Promise.resolve().then(() => setQuery(""));
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const list = Array.from(identities.values());
    const normalized = query.trim().toLowerCase();
    if (!normalized) return list;
    return list.filter(
      (identity) =>
        identity.displayName.toLowerCase().includes(normalized) ||
        identity.username.toLowerCase().includes(normalized),
    );
  }, [identities, query]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        aria-label="Listeyi kapat"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />
      <div
        className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-violet-500/20 bg-zinc-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="connection-list-title"
      >
        <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="profile-display-font text-lg font-black text-white" id="connection-list-title">
            {title}
          </h3>
          <button
            className="rounded-lg p-2 text-zinc-400 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2">
            <Search className="h-4 w-4 text-zinc-500" />
            <input
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="İsim veya kullanıcı adı ara..."
              value={query}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {filtered.length ? (
            <div className="space-y-2">
              {filtered.map((identity) => (
                <button
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-left transition hover:border-violet-500/40"
                  key={identity.userId}
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${identity.username}`);
                  }}
                  type="button"
                >
                  <UserAvatar
                    avatarUrl={identity.avatarUrl}
                    className="h-10 w-10"
                    imageClassName="h-10 w-10 rounded-full border border-white/15 object-cover"
                    name={identity.displayName}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{identity.displayName}</p>
                    <p className="truncate text-xs text-zinc-500">@{identity.username}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-zinc-500">Sonuç bulunamadı.</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
