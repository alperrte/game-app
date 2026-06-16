import { CornerDownRight, Send, Smile, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { SOCIAL_ROUTES, ROUTES } from "../../../lib/constants";
import { formatSocialTime } from "../../../utils/formatSocialTime";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import {
  cacheUserIdentity,
  readUserIdentityCache,
  resolveUserDisplayName,
} from "../../../utils/userIdentityCache";
import { useAuthStore } from "../../../store/authStore";
import { getImageUrl } from "../../user/utils/profileImage";
import { userProfileService } from "../../user/services/userProfileService";
import type { UserProfile } from "../../user/types/userProfile.types";
import { socialService } from "../services/socialService";
import type {
  ChatRoomResponse,
  MessageReactionResponse,
  MessageResponse,
} from "../types/social.types";
import { ConfirmModal } from "../../../components/modal/ConfirmModal";
import {
  DEFAULT_EMOJIS,
  EmojiPickerPopover,
} from "../../../components/ui/EmojiPickerPopover";

const MESSAGE_POLL_INTERVAL_MS = 5000;
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];
const DEFAULT_AVATAR_URL =
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80";

function resolveUsername(
  userId: number,
  profiles = new Map<number, UserProfile>(),
  cachedUsernames = readUserIdentityCache(),
): string | undefined {
  return profiles.get(userId)?.username ?? cachedUsernames.get(userId);
}

function resolveAvatarUrl(
  userId: number,
  profiles = new Map<number, UserProfile>(),
): string {
  const avatarUrl = profiles.get(userId)?.avatarUrl;

  if (avatarUrl) {
    return getImageUrl(avatarUrl);
  }

  return DEFAULT_AVATAR_URL;
}

function getRoomTitle(
  room: ChatRoomResponse,
  currentUserId?: number,
  currentUsername?: string,
  profiles = new Map<number, UserProfile>(),
  cachedUsernames = readUserIdentityCache(),
): string {
  if (room.roomName?.trim()) {
    return room.roomName.trim();
  }

  if (room.otherParticipantUserId) {
    return resolveUserDisplayName(
      room.otherParticipantUserId,
      profiles,
      cachedUsernames,
      currentUserId,
      currentUsername,
    );
  }

  if (room.roomType === "GROUP") {
    return `Grup #${room.id}`;
  }

  return `Sohbet #${room.id}`;
}

async function loadUserProfiles(
  userIds: Array<number | null | undefined>,
): Promise<Map<number, UserProfile>> {
  const uniqueUserIds = Array.from(
    new Set(userIds.filter((userId): userId is number => typeof userId === "number")),
  );

  const profiles = await Promise.allSettled(
    uniqueUserIds.map((userId) => userProfileService.getProfileById(userId)),
  );

  return profiles.reduce<Map<number, UserProfile>>((profileMap, result, index) => {
    if (result.status === "fulfilled") {
      const profile = result.value;
      profileMap.set(uniqueUserIds[index], profile);
      cacheUserIdentity(uniqueUserIds[index], profile.username);
    }

    return profileMap;
  }, new Map());
}

function groupReactions(
  reactions: MessageReactionResponse[] = [],
  currentUserId?: number,
) {
  const groups = new Map<string, { count: number; reactedByMe: boolean }>();

  reactions.forEach((reaction) => {
    const current = groups.get(reaction.emoji) ?? { count: 0, reactedByMe: false };

    groups.set(reaction.emoji, {
      count: current.count + 1,
      reactedByMe:
        current.reactedByMe || reaction.userId === currentUserId,
    });
  });

  return Array.from(groups.entries()).map(([emoji, data]) => ({
    emoji,
    ...data,
  }));
}

export default function MessagesPage() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [participantProfiles, setParticipantProfiles] = useState<
    Map<number, UserProfile>
  >(() => new Map());
  const [draft, setDraft] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideConfirmOpen, setHideConfirmOpen] = useState(false);
  const [hidingChat, setHidingChat] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<MessageResponse | null>(
    null,
  );
  const [reactionPickerMessageId, setReactionPickerMessageId] = useState<
    number | null
  >(null);
  const cachedUsernames = useMemo(() => readUserIdentityCache(), [rooms, participantProfiles]);

  const activeRoomId = useMemo(() => {
    const parsedRoomId = Number(roomId);
    return Number.isFinite(parsedRoomId) ? parsedRoomId : null;
  }, [roomId]);

  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? null,
    [activeRoomId, rooms],
  );

  useEffect(() => {
    if (!user?.userId) return;

    void loadUserProfiles([user.userId]).then((profiles) => {
      setParticipantProfiles((currentProfiles) => {
        const nextProfiles = new Map(currentProfiles);
        profiles.forEach((profile, userId) => nextProfiles.set(userId, profile));
        return nextProfiles;
      });
    });
  }, [user?.userId]);

  const refreshRooms = useCallback(async () => {
    if (!user?.userId) {
      setRooms([]);
      return [];
    }

    const loadedRooms = await socialService.getMyChatRooms();
    const profiles = await loadUserProfiles(
      loadedRooms.map((room) => room.otherParticipantUserId),
    );

    setRooms(loadedRooms);
    setParticipantProfiles(profiles);

    return loadedRooms;
  }, [user?.userId]);

  useEffect(() => {
    let isMounted = true;

    async function loadRooms() {
      if (!user?.userId) {
        setRooms([]);
        setLoadingRooms(false);
        return;
      }

      setLoadingRooms(true);
      setError(null);

      try {
        const loadedRooms = await refreshRooms();

        if (!isMounted) return;

        if (!activeRoomId && loadedRooms[0]) {
          navigate(SOCIAL_ROUTES.chatRoom(loadedRooms[0].id), { replace: true });
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, "Sohbet odaları yüklenemedi."));
          setRooms([]);
        }
      } finally {
        if (isMounted) {
          setLoadingRooms(false);
        }
      }
    }

    void loadRooms();

    return () => {
      isMounted = false;
    };
  }, [activeRoomId, navigate, refreshRooms, user?.userId]);

  const refreshMessages = useCallback(async () => {
    if (!activeRoomId) {
      setMessages([]);
      return;
    }

    const loadedMessages = await socialService.getChatRoomMessages(activeRoomId);
    const senderProfiles = await loadUserProfiles(
      loadedMessages.flatMap((message) => [
        message.senderUserId,
        message.replyToSenderUserId,
      ]),
    );

    setMessages(loadedMessages);
    setParticipantProfiles((currentProfiles) => {
      const nextProfiles = new Map(currentProfiles);
      senderProfiles.forEach((profile, userId) => nextProfiles.set(userId, profile));
      return nextProfiles;
    });
    await refreshRooms();
  }, [activeRoomId, refreshRooms]);

  useEffect(() => {
    setReplyingToMessage(null);
    setReactionPickerMessageId(null);
    setEmojiOpen(false);
  }, [activeRoomId]);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      if (!activeRoomId) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      setError(null);

      try {
        const loadedMessages =
          await socialService.getChatRoomMessages(activeRoomId);
        const senderProfiles = await loadUserProfiles(
          loadedMessages.flatMap((message) => [
            message.senderUserId,
            message.replyToSenderUserId,
          ]),
        );

        if (isMounted) {
          setMessages(loadedMessages);
          setParticipantProfiles((currentProfiles) => {
            const nextProfiles = new Map(currentProfiles);
            senderProfiles.forEach((profile, userId) =>
              nextProfiles.set(userId, profile),
            );
            return nextProfiles;
          });
        }

        await refreshRooms();
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err, "Mesajlar yüklenemedi."));
          setMessages([]);
        }
      } finally {
        if (isMounted) {
          setLoadingMessages(false);
        }
      }
    }

    void loadMessages();

    return () => {
      isMounted = false;
    };
  }, [activeRoomId, refreshRooms]);

  useEffect(() => {
    if (!activeRoomId) return;

    const intervalId = window.setInterval(() => {
      void refreshMessages().catch(() => undefined);
    }, MESSAGE_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeRoomId, refreshMessages]);

  async function sendMessage() {
    const content = draft.trim();

    if (!content || !activeRoomId || sendingMessage) return;

    setSendingMessage(true);
    setError(null);

    try {
      const message = await socialService.sendMessage({
        chatRoomId: activeRoomId,
        content,
        replyToMessageId: replyingToMessage?.id,
      });

      setMessages((currentMessages) => [...currentMessages, message]);
      setDraft("");
      setReplyingToMessage(null);
      setEmojiOpen(false);
      await refreshRooms();
    } catch (err) {
      setError(getErrorMessage(err, "Mesaj gönderilemedi."));
    } finally {
      setSendingMessage(false);
    }
  }

  async function toggleReaction(messageId: number, emoji: string) {
    try {
      const updatedMessage = await socialService.toggleMessageReaction(
        messageId,
        emoji,
      );

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId ? updatedMessage : message,
        ),
      );
      setReactionPickerMessageId(null);
    } catch (err) {
      setError(getErrorMessage(err, "Tepki gönderilemedi."));
    }
  }

  function addEmojiToDraft(emoji: string) {
    setDraft((currentDraft) => `${currentDraft}${emoji}`);
  }

  function openProfile(userId?: number | null) {
    if (!userId) return;

    const username = resolveUsername(userId, participantProfiles, cachedUsernames);

    if (!username) return;

    navigate(ROUTES.profile.replace(":username", username));
  }

  const activeParticipantId = activeRoom?.otherParticipantUserId ?? null;
  const activeParticipantTitle = activeRoom
    ? getRoomTitle(
        activeRoom,
        user?.userId,
        user?.username,
        participantProfiles,
        cachedUsernames,
      )
    : "Sohbet seç";

  const lastOwnMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.senderUserId === user?.userId) {
        return messages[index]?.id ?? null;
      }
    }

    return null;
  }, [messages, user?.userId]);

  async function hideActiveChat() {
    if (!activeRoomId || hidingChat) return;

    setHidingChat(true);
    setError(null);

    try {
      await socialService.hideChatRoom(activeRoomId);
      setHideConfirmOpen(false);
      const loadedRooms = await refreshRooms();
      const nextRoom = loadedRooms[0];

      if (nextRoom) {
        navigate(SOCIAL_ROUTES.chatRoom(nextRoom.id), { replace: true });
      } else {
        navigate(SOCIAL_ROUTES.messages, { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err, "Sohbet kapatılamadı."));
    } finally {
      setHidingChat(false);
    }
  }

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden bg-[#050914] px-4 py-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid h-full min-h-0 max-w-6xl gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-[#0d1424] to-[#080d18] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="border-b border-white/8 px-5 py-4">
            <h1 className="text-base font-black tracking-tight text-white">Mesajlar</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              {rooms.length ? `${rooms.length} sohbet` : "Aktif sohbet yok"}
            </p>
          </div>

          <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {loadingRooms ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((item) => (
                  <div
                    className="flex animate-pulse items-center gap-3 rounded-xl px-3 py-3"
                    key={item}
                  >
                    <div className="h-12 w-12 rounded-full bg-white/8" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-24 rounded bg-white/8" />
                      <div className="h-2.5 w-36 rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : rooms.length ? (
              rooms.map((room) => {
                const title = getRoomTitle(
                  room,
                  user?.userId,
                  user?.username,
                  participantProfiles,
                  cachedUsernames,
                );
                const preview = room.lastMessageContent || "Henüz mesaj yok";
                const participantId = room.otherParticipantUserId;
                const avatarUrl = participantId
                  ? resolveAvatarUrl(participantId, participantProfiles)
                  : DEFAULT_AVATAR_URL;
                const isActive = activeRoomId === room.id;
                const hasUnread = (room.unreadCount ?? 0) > 0;

                return (
                  <div
                    className={`group relative flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition ${
                      isActive
                        ? "bg-violet-500/12"
                        : "hover:bg-white/[0.04]"
                    }`}
                    key={room.id}
                    onClick={() => navigate(SOCIAL_ROUTES.chatRoom(room.id))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(SOCIAL_ROUTES.chatRoom(room.id));
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {isActive ? (
                      <span className="absolute bottom-2 left-0 top-2 w-1 rounded-r-full bg-gradient-to-b from-violet-400 to-fuchsia-500" />
                    ) : null}

                    <button
                      className="relative shrink-0 cursor-pointer"
                      onClick={(event) => {
                        event.stopPropagation();
                        openProfile(participantId);
                      }}
                      type="button"
                    >
                      <span
                        className={`block rounded-full p-0.5 ${
                          isActive
                            ? "bg-gradient-to-br from-violet-400 to-fuchsia-500"
                            : "bg-white/10 group-hover:bg-white/20"
                        }`}
                      >
                        <img
                          alt={title}
                          className="h-11 w-11 rounded-full border-2 border-[#0d1424] object-cover"
                          src={avatarUrl}
                        />
                      </span>
                    </button>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-sm ${
                            hasUnread ? "font-bold text-white" : "font-semibold text-zinc-200"
                          }`}
                        >
                          {title}
                        </span>
                        {room.lastMessageAt ? (
                          <span className="shrink-0 text-[10px] text-zinc-500">
                            {formatSocialTime(room.lastMessageAt)}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-2">
                        <span
                          className={`block truncate text-xs ${
                            hasUnread ? "font-medium text-zinc-300" : "text-zinc-500"
                          }`}
                        >
                          {preview}
                        </span>
                        {hasUnread ? (
                          <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                            {room.unreadCount}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="mx-2 mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-zinc-300">Henüz sohbet yok</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Bir profilden veya gönderiden mesaj başlatabilirsin.
                </p>
              </div>
            )}
          </div>
        </aside>

        <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0a101c]/88">
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
            <div className="min-w-0 flex-1">
            {activeRoom && activeParticipantId ? (
              <button
                className="flex cursor-pointer items-center gap-3 text-left transition hover:opacity-90"
                onClick={() => openProfile(activeParticipantId)}
                type="button"
              >
                <img
                  alt={activeParticipantTitle}
                  className="h-11 w-11 rounded-full border border-white/15 object-cover"
                  src={resolveAvatarUrl(activeParticipantId, participantProfiles)}
                />
                <span>
                  <span className="block text-base font-bold text-white">
                    {activeParticipantTitle}
                  </span>
                  {activeRoom.roomType === "DIRECT" && (
                    <span className="mt-0.5 block text-xs text-zinc-500">
                      Direkt mesaj
                    </span>
                  )}
                </span>
              </button>
            ) : (
              <h2 className="text-base font-bold">{activeParticipantTitle}</h2>
            )}
            {error && <p className="mt-1 text-xs text-amber-200">{error}</p>}
            </div>

            {activeRoomId ? (
              <button
                aria-label="Sohbeti kapat"
                className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-zinc-400 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
                onClick={() => setHideConfirmOpen(true)}
                type="button"
              >
                <X size={18} />
              </button>
            ) : null}
          </header>

          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4">
            {!activeRoomId ? (
              <div className="grid h-full place-items-center text-center text-sm text-zinc-500">
                Sol taraftan bir sohbet seç.
              </div>
            ) : loadingMessages ? (
              <p className="text-sm text-zinc-400">Mesajlar yükleniyor...</p>
            ) : messages.length ? (
              messages.map((message) => {
                const isMine = message.senderUserId === user?.userId;
                const senderLabel = isMine
                  ? "Sen"
                  : resolveUserDisplayName(
                      message.senderUserId,
                      participantProfiles,
                      cachedUsernames,
                      user?.userId,
                      user?.username,
                    );
                const replySenderLabel =
                  message.replyToSenderUserId === user?.userId
                    ? "Sen"
                    : resolveUserDisplayName(
                        message.replyToSenderUserId ?? 0,
                        participantProfiles,
                        cachedUsernames,
                        user?.userId,
                        user?.username,
                      );
                const reactionGroups = groupReactions(
                  message.reactions,
                  user?.userId,
                );

                return (
                  <div
                    className={`group relative py-0.5 ${
                      isMine ? "flex justify-end gap-2" : "flex justify-start gap-2"
                    }`}
                    key={message.id}
                  >
                    {!isMine && (
                      <button
                        className="mt-1 shrink-0 cursor-pointer rounded-full transition hover:-translate-y-0.5"
                        onClick={() => openProfile(message.senderUserId)}
                        type="button"
                      >
                        <img
                          alt={senderLabel}
                          className="h-8 w-8 rounded-full border border-white/15 object-cover"
                          src={resolveAvatarUrl(
                            message.senderUserId,
                            participantProfiles,
                          )}
                        />
                      </button>
                    )}

                    <div className="relative max-w-[72%]">
                      {!isMine && activeRoom?.roomType === "GROUP" && (
                        <p className="mb-1 text-[11px] font-semibold text-violet-300">
                          {senderLabel}
                        </p>
                      )}

                      <div
                        className={
                          isMine
                            ? "rounded-2xl rounded-br-md bg-violet-700 px-4 py-2.5 text-sm text-white"
                            : "rounded-2xl rounded-bl-md bg-white/[0.06] px-4 py-2.5 text-sm text-zinc-100"
                        }
                      >
                        {message.replyToMessageId && message.replyToContent ? (
                          <div className="mb-2 rounded-lg border-l-2 border-violet-300/70 bg-black/15 px-2.5 py-1.5">
                            <p className="text-[11px] font-semibold text-violet-200">
                              {replySenderLabel}
                            </p>
                            <p className="truncate text-xs text-zinc-300/90">
                              {message.replyToContent}
                            </p>
                          </div>
                        ) : null}
                        {message.content}
                      </div>

                      <div
                        className={`absolute top-full z-10 mt-0.5 flex gap-1 opacity-0 transition pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto ${
                          isMine ? "right-0" : "left-0"
                        }`}
                      >
                        <button
                          aria-label="Yanıtla"
                          className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border border-white/10 bg-[#0b1220] px-2.5 text-[11px] font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white"
                          onClick={() => setReplyingToMessage(message)}
                          type="button"
                        >
                          <CornerDownRight size={12} />
                          Yanıtla
                        </button>
                        <div className="relative">
                          <button
                            aria-label="Tepki ver"
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[#0b1220] text-zinc-200 transition hover:bg-white/[0.08] hover:text-white"
                            onClick={() =>
                              setReactionPickerMessageId((currentId) =>
                                currentId === message.id ? null : message.id,
                              )
                            }
                            type="button"
                          >
                            <Smile size={13} />
                          </button>
                          {reactionPickerMessageId === message.id ? (
                            <EmojiPickerPopover
                              className={
                                isMine
                                  ? "absolute bottom-9 right-full z-30 mr-1 grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40"
                                  : "absolute bottom-9 left-0 z-30 grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40"
                              }
                              emojis={QUICK_REACTIONS}
                              onClose={() => setReactionPickerMessageId(null)}
                              onSelect={(emoji) => void toggleReaction(message.id, emoji)}
                            />
                          ) : null}
                        </div>
                      </div>

                      {reactionGroups.length > 0 ? (
                        <div
                          className={`mt-0.5 flex flex-wrap gap-1 ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          {reactionGroups.map((reaction) => (
                            <button
                              className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${
                                reaction.reactedByMe
                                  ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                                  : "border-white/10 bg-[#0b1220] text-zinc-300 hover:bg-white/[0.06]"
                              }`}
                              key={`${message.id}-${reaction.emoji}`}
                              onClick={() =>
                                void toggleReaction(message.id, reaction.emoji)
                              }
                              type="button"
                            >
                              <span>{reaction.emoji}</span>
                              <span>{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      <p
                        className={
                          isMine
                            ? "mt-0.5 text-right text-[10px] leading-none text-zinc-500"
                            : "mt-0.5 text-[10px] leading-none text-zinc-500"
                        }
                      >
                        {formatSocialTime(message.createdAt)}
                      </p>
                      {isMine &&
                        message.isRead &&
                        message.id === lastOwnMessageId && (
                          <p className="mt-0.5 text-right text-[10px] font-semibold text-violet-300/90">
                            Görüldü
                            {message.readAt
                              ? ` · ${formatSocialTime(message.readAt)}`
                              : ""}
                          </p>
                        )}
                    </div>

                    {isMine && (
                      <button
                        className="mt-1 shrink-0 cursor-pointer rounded-full transition hover:-translate-y-0.5"
                        onClick={() => openProfile(user?.userId)}
                        type="button"
                      >
                        <img
                          alt={senderLabel}
                          className="h-8 w-8 rounded-full border border-white/15 object-cover"
                          src={resolveAvatarUrl(
                            user?.userId ?? message.senderUserId,
                            participantProfiles,
                          )}
                        />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-zinc-500">
                Bu sohbette henüz mesaj yok. İlk mesajı yaz.
              </p>
            )}
          </div>

          <div className="shrink-0 border-t border-white/10 p-4">
            {replyingToMessage ? (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-violet-300">
                    Yanıtlanıyor:{" "}
                    {replyingToMessage.senderUserId === user?.userId
                      ? "Sen"
                      : resolveUserDisplayName(
                          replyingToMessage.senderUserId,
                          participantProfiles,
                          cachedUsernames,
                          user?.userId,
                          user?.username,
                        )}
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    {replyingToMessage.content}
                  </p>
                </div>
                <button
                  aria-label="Yanıtı iptal et"
                  className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                  onClick={() => setReplyingToMessage(null)}
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}

            <div className="flex gap-3">
              <div className="relative min-w-0 flex-1">
                <input
                  className="h-11 w-full rounded-lg border border-white/10 bg-slate-950/55 px-4 pr-11 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/60"
                  disabled={!activeRoomId || sendingMessage}
                  maxLength={1000}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void sendMessage();
                    }
                  }}
                  placeholder={
                    replyingToMessage ? "Yanıtını yaz..." : "Mesaj yaz..."
                  }
                  value={draft}
                />
                <button
                  aria-label="Emoji ekle"
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                  disabled={!activeRoomId || sendingMessage}
                  onClick={() => setEmojiOpen((open) => !open)}
                  type="button"
                >
                  <Smile size={17} />
                </button>
                {emojiOpen ? (
                  <EmojiPickerPopover
                    className={
                      replyingToMessage?.senderUserId === user?.userId
                        ? "absolute bottom-11 left-0 z-30 grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40"
                        : "absolute bottom-11 right-0 z-30 grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40"
                    }
                    emojis={DEFAULT_EMOJIS}
                    onClose={() => setEmojiOpen(false)}
                    onSelect={addEmojiToDraft}
                  />
                ) : null}
              </div>
              <button
                className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-bold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!activeRoomId || !draft.trim() || sendingMessage}
                onClick={() => void sendMessage()}
                type="button"
              >
                <Send size={17} />
                Gönder
              </button>
            </div>
          </div>
        </section>
      </div>

      <ConfirmModal
        cancelLabel="Vazgeç"
        confirmLabel="Evet, kapat"
        message="Bu sohbet listenizden kaldırılacak. Yeni mesaj gönderdiğinizde veya size mesaj geldiğinde sohbet tekrar görünecek."
        onCancel={() => setHideConfirmOpen(false)}
        onConfirm={() => void hideActiveChat()}
        open={hideConfirmOpen}
        title="Sohbeti kapatmak istediğinize emin misiniz?"
      />
    </div>
  );
}
