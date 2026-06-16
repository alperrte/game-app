import { Check, UserPlus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import { ROUTES } from "../../../lib/constants";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import {
  cacheUserIdentity,
  resolveUserDisplayName,
} from "../../../utils/userIdentityCache";
import { useAuthStore } from "../../../store/authStore";
import { getImageUrl } from "../../user/utils/profileImage";
import { userProfileService } from "../../user/services/userProfileService";
import type { UserProfile } from "../../user/types/userProfile.types";
import { socialService } from "../services/socialService";
import type { FriendRequestResponse } from "../types/social.types";

const DEFAULT_AVATAR_URL =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80";

type FriendRequestsModalProps = {
  open: boolean;
  onClose: () => void;
  onRequestsChanged?: () => void;
};

export function FriendRequestsModal({
  open,
  onClose,
  onRequestsChanged,
}: FriendRequestsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<FriendRequestResponse[]>([]);
  const [profiles, setProfiles] = useState<Map<number, UserProfile>>(new Map());
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user?.userId) {
      setRequests([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const incoming = await socialService.getIncomingFriendRequests(user.userId);
      setRequests(incoming);

      const senderIds = incoming.map((request) => request.senderUserId);
      const profileResults = await Promise.allSettled(
        senderIds.map((userId) => userProfileService.getProfileById(userId)),
      );

      const nextProfiles = new Map<number, UserProfile>();
      profileResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const profile = result.value;
          nextProfiles.set(senderIds[index], profile);
          cacheUserIdentity(senderIds[index], profile.username);
        }
      });
      setProfiles(nextProfiles);
    } catch (err) {
      setError(getErrorMessage(err, "İstekler yüklenemedi."));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    if (!open) return;
    void loadRequests();
  }, [loadRequests, open]);

  async function handleAccept(requestId: number) {
    setActionId(requestId);
    setError(null);

    try {
      await socialService.acceptFriendRequest(requestId);
      setRequests((current) => current.filter((request) => request.id !== requestId));
      onRequestsChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, "İstek kabul edilemedi."));
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(requestId: number) {
    setActionId(requestId);
    setError(null);

    try {
      await socialService.rejectFriendRequest(requestId);
      setRequests((current) => current.filter((request) => request.id !== requestId));
      onRequestsChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, "İstek reddedilemedi."));
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
        aria-labelledby="friend-requests-title"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-white" id="friend-requests-title">
              Arkadaşlık İstekleri
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Gelen istekleri kabul edebilir veya reddedebilirsin.
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
              İstekler yükleniyor...
            </div>
          ) : requests.length ? (
            <div className="space-y-3">
              {requests.map((request) => {
                const senderId = request.senderUserId;
                const profile = profiles.get(senderId);
                const displayName = resolveUserDisplayName(
                  senderId,
                  profiles,
                  new Map(),
                  user?.userId,
                  user?.username,
                );
                const avatarUrl = profile?.avatarUrl
                  ? getImageUrl(profile.avatarUrl)
                  : DEFAULT_AVATAR_URL;
                const isBusy = actionId === request.id;

                return (
                  <div
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3"
                    key={request.id}
                  >
                    <button
                      className="shrink-0 cursor-pointer rounded-full transition hover:-translate-y-0.5"
                      onClick={() => openProfile(senderId)}
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
                        onClick={() => openProfile(senderId)}
                        type="button"
                      >
                        {displayName}
                      </button>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Sana arkadaşlık isteği gönderdi
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        aria-label="Kabul et"
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-violet-700 text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isBusy}
                        onClick={() => void handleAccept(request.id)}
                        type="button"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        aria-label="Reddet"
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-zinc-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isBusy}
                        onClick={() => void handleReject(request.id)}
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid place-items-center px-4 py-16 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-white/10 bg-violet-500/10 text-violet-300">
                <UserPlus size={28} />
              </div>
              <p className="text-base font-bold text-white">Bekleyen istek yok</p>
              <p className="mt-2 max-w-xs text-sm leading-6 text-zinc-500">
                Yeni arkadaşlık istekleri geldiğinde burada görünecek.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
