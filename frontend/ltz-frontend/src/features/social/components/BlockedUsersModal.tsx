import { UserRound, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { ConfirmModal } from "../../../components/modal/ConfirmModal";
import { ROUTES } from "../../../lib/constants";
import { useAuthStore } from "../../../store/authStore";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import {
  cacheUserIdentity,
  resolveUserDisplayName,
} from "../../../utils/userIdentityCache";
import { userProfileService } from "../../user/services/userProfileService";
import { getImageUrl } from "../../user/utils/profileImage";
import { socialService } from "../services/socialService";

const DEFAULT_AVATAR_URL =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80";

type BlockedUsersModalProps = {
  open: boolean;
  onClose: () => void;
};

type BlockedUser = Awaited<ReturnType<typeof socialService.getBlockedUsers>>[number];
type UserProfile = Awaited<ReturnType<typeof userProfileService.getProfileById>>;

export function BlockedUsersModal({ open, onClose }: BlockedUsersModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [profiles, setProfiles] = useState<Map<number, UserProfile>>(new Map());
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<BlockedUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    if (!user?.userId) {
      setBlocks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const loadedBlocks = await socialService.getBlockedUsers(user.userId);
      setBlocks(loadedBlocks);

      const blockedIds = loadedBlocks.map((block) => block.blockedUserId);
      const profileResults = await Promise.allSettled(
        blockedIds.map((userId) => userProfileService.getProfileById(userId)),
      );

      const nextProfiles = new Map<number, UserProfile>();
      profileResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const profile = result.value;
          nextProfiles.set(blockedIds[index], profile);
          cacheUserIdentity(blockedIds[index], profile.username);
        }
      });
      setProfiles(nextProfiles);
    } catch (err) {
      setError(getErrorMessage(err, "Engellenen kullanıcılar yüklenemedi."));
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!open) return;
    Promise.resolve().then(() => {
      void loadBlockedUsers();
    });
  }, [loadBlockedUsers, open]);

  async function handleUnblock() {
    if (!confirmTarget) return;

    setActionId(confirmTarget.id);
    setError(null);

    try {
      await socialService.unblockUser(confirmTarget.blockedUserId);
      setBlocks((current) =>
        current.filter((block) => block.id !== confirmTarget.id),
      );
      setConfirmTarget(null);
    } catch (err) {
      setError(getErrorMessage(err, "Engel kaldırılamadı."));
    } finally {
      setActionId(null);
    }
  }

  function openProfile(userId: number) {
    const username = profiles.get(userId)?.username;

    if (!username) return;

    onClose();
    navigate(ROUTES.profile.replace(":username", username));
  }

  if (!open) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="flex max-h-[min(80vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a101c] shadow-2xl shadow-black/50"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="blocked-users-title"
        >
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 className="text-lg font-black text-white" id="blocked-users-title">
                Engellenen Kullanıcılar
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Engelini kaldırmak istediğin kullanıcıları buradan yönetebilirsin.
              </p>
            </div>
            <button
              aria-label="Kapat"
              className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
              onClick={onClose}
              type="button"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4">
            {error ? (
              <p className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                {error}
              </p>
            ) : null}

            {loading ? (
              <div className="grid place-items-center py-16 text-sm text-zinc-400">
                Engellenen kullanıcılar yükleniyor...
              </div>
            ) : blocks.length ? (
              <div className="space-y-3">
                {blocks.map((block) => {
                  const blockedId = block.blockedUserId;
                  const profile = profiles.get(blockedId);
                  const displayName = resolveUserDisplayName(
                    blockedId,
                    profiles,
                    new Map(),
                    user?.userId,
                    user?.username,
                  );
                  const avatarUrl = profile?.avatarUrl
                    ? getImageUrl(profile.avatarUrl)
                    : DEFAULT_AVATAR_URL;
                  const isBusy = actionId === block.id;

                  return (
                    <div
                      className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3"
                      key={block.id}
                    >
                      <button
                        className="shrink-0 cursor-pointer rounded-full transition hover:-translate-y-0.5"
                        onClick={() => openProfile(blockedId)}
                        type="button"
                      >
                        <img
                          alt={displayName}
                          className="h-12 w-12 rounded-full border border-white/15 object-cover"
                          src={avatarUrl}
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <button
                          className="cursor-pointer text-left text-sm font-bold text-white transition hover:text-violet-300"
                          onClick={() => openProfile(blockedId)}
                          type="button"
                        >
                          {displayName}
                        </button>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Bu kullanıcı engellenmiş durumda.
                        </p>
                      </div>

                      <button
                        className="h-9 shrink-0 cursor-pointer rounded-lg border border-white/10 px-3 text-xs font-bold text-zinc-200 transition hover:border-violet-300/40 hover:bg-violet-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isBusy}
                        onClick={() => setConfirmTarget(block)}
                        type="button"
                      >
                        Engeli Kaldır
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid place-items-center px-4 py-16 text-center">
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-violet-500/10 text-violet-300">
                  <UserRound size={28} />
                </div>
                <p className="text-base font-bold text-white">Engellenen kullanıcı yok</p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                  Bir kullanıcıyı engellediğinde burada görünecek.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        cancelLabel="Vazgeç"
        confirmLabel="Engeli Kaldır"
        message="Bu kullanıcının engelini kaldırmak istediğine emin misin?"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={() => void handleUnblock()}
        open={Boolean(confirmTarget)}
        title="Engeli kaldır"
      />
    </>,
    document.body,
  );
}
