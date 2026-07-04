import {
  ArrowLeft,
  Camera,
  Check,
  ChevronDown,
  CornerDownRight,
  Crown,
  MessageCircle,
  MessageSquarePlus,
  Paperclip,
  Pin,
  PinOff,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Trash2,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_BASE_URL, ROUTES } from "../../../lib/constants";
import { getAccessToken } from "../../../lib/token";
import {
  DEFAULT_EMOJIS,
  EmojiPickerPopover,
} from "../../../components/ui/EmojiPickerPopover";
import { useAuthStore } from "../../../store/authStore";
import { formatSocialTime } from "../../../utils/formatSocialTime";
import { getErrorMessage } from "../../../utils/getErrorMessage";
import { getImageUrl } from "../../user/utils/profileImage";
import { userProfileService } from "../../user/services/userProfileService";
import type { UserProfileResponse } from "../../user/types/user";
import { socialService } from "../services/socialService";
import type {
  ChatRoomMemberResponse,
  ChatRoomResponse,
  MessageResponse,
} from "../types/social.types";
import { useChatWidget } from "../context/ChatWidgetContext";

const TYPING_IDLE_MS = 1800;
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

function roomTitle(
  room: ChatRoomResponse,
  profiles: Map<number, UserProfileResponse>,
) {
  if (room.roomType === "GROUP" && room.roomName?.trim()) {
    return room.roomName.trim();
  }
  if (room.otherParticipantUserId) {
    const profile = profiles.get(room.otherParticipantUserId);
    return profile?.displayName?.trim() || profile?.username || `Oyuncu #${room.otherParticipantUserId}`;
  }
  return room.roomName?.trim() || (room.roomType === "GROUP" ? `Grup #${room.id}` : `Sohbet #${room.id}`);
}

function avatarUrl(
  userId: number | null | undefined,
  profiles: Map<number, UserProfileResponse>,
) {
  const url = userId ? profiles.get(userId)?.avatarUrl : null;
  return url ? getImageUrl(url) : null;
}

function groupImageUrl(room: ChatRoomResponse) {
  return room.imageUrl ? getImageUrl(room.imageUrl) : null;
}

function groupedReactions(
  message: MessageResponse,
  currentUserId?: number,
) {
  const groups = new Map<string, { count: number; mine: boolean }>();
  (message.reactions ?? []).forEach((reaction) => {
    const current = groups.get(reaction.emoji) ?? { count: 0, mine: false };
    groups.set(reaction.emoji, {
      count: current.count + 1,
      mine: current.mine || reaction.userId === currentUserId,
    });
  });
  return Array.from(groups.entries()).map(([emoji, value]) => ({
    emoji,
    ...value,
  }));
}

export function FloatingChatWidget() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { closeChat, isOpen, openChat, requestedRoomId, toggleChat } =
    useChatWidget();
  const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
  const [profiles, setProfiles] = useState<Map<number, UserProfileResponse>>(
    new Map(),
  );
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<MessageResponse | null>(null);
  const [reactionMessageId, setReactionMessageId] = useState<number | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploadingMessageMedia, setUploadingMessageMedia] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState<Set<number>>(new Set());
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const [socketVersion, setSocketVersion] = useState(0);
  const [query, setQuery] = useState("");
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [messageSearchResults, setMessageSearchResults] = useState<
    MessageResponse[]
  >([]);
  const [messageSearchLoading, setMessageSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [uploadingGroupImage, setUploadingGroupImage] = useState(false);
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [directFormOpen, setDirectFormOpen] = useState(false);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<ChatRoomMemberResponse[]>([]);
  const [groupDetailsLoading, setGroupDetailsLoading] = useState(false);
  const [memberActionId, setMemberActionId] = useState<number | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupNameDraft, setGroupNameDraft] = useState("");
  const [friendIds, setFriendIds] = useState<number[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<number>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const groupImageInputRef = useRef<HTMLInputElement | null>(null);
  const messageMediaInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  const loadProfiles = useCallback(async (userIds: number[]) => {
    const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
    const results = await Promise.allSettled(
      uniqueIds.map((userId) => userProfileService.getProfileById(userId)),
    );
    setProfiles((current) => {
      const next = new Map(current);
      results.forEach((result, index) => {
        if (result.status === "fulfilled") next.set(uniqueIds[index], result.value);
      });
      return next;
    });
  }, []);

  const loadRooms = useCallback(async () => {
    if (!user?.userId) return;
    const loaded = await socialService.getMyChatRooms();
    setRooms(loaded);
    await loadProfiles(
      loaded
        .map((room) => room.otherParticipantUserId)
        .filter((id): id is number => typeof id === "number"),
    );
  }, [loadProfiles, user?.userId]);

  const loadMessages = useCallback(async () => {
    if (!activeRoomId) return;
    const loaded = await socialService.getChatRoomMessages(activeRoomId);
    setMessages(loaded);
    await loadProfiles(loaded.map((message) => message.senderUserId));
    await socialService.markChatRoomAsRead(activeRoomId).catch(() => undefined);
  }, [activeRoomId, loadProfiles]);

  useEffect(() => {
    if (!isOpen) return;
    void Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);
      try {
        await loadRooms();
      } catch (err) {
        setError(getErrorMessage(err, "Sohbetler yüklenemedi."));
      } finally {
        setLoading(false);
      }
    });
  }, [isOpen, loadRooms]);

  useEffect(() => {
    if (!requestedRoomId) return;
    void Promise.resolve().then(() => setActiveRoomId(requestedRoomId));
  }, [requestedRoomId]);

  useEffect(() => {
    if (!isOpen || !activeRoomId) return;
    void Promise.resolve().then(async () => {
      setLoading(true);
      try {
        await loadMessages();
      } catch (err) {
        setError(getErrorMessage(err, "Mesajlar yüklenemedi."));
      } finally {
        setLoading(false);
      }
    });

  }, [activeRoomId, isOpen, loadMessages]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      setTypingUserIds(new Set());
      setReplyingTo(null);
      setReactionMessageId(null);
      setEmojiOpen(false);
      setMessageSearchQuery("");
      setMessageSearchResults([]);
    });
  }, [activeRoomId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !user?.userId) return;

    const websocketBase = API_BASE_URL.replace(/^http/, "ws");
    const socket = new WebSocket(
      `${websocketBase}/ws/chat?token=${encodeURIComponent(token)}`,
    );
    let disposed = false;
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const realtimeEvent = JSON.parse(event.data) as {
          type: string;
          roomId?: number;
          userId?: number;
          online?: boolean;
          typing?: boolean;
          userIds?: number[];
          payload?: MessageResponse | ChatRoomResponse | number;
        };

        if (realtimeEvent.type === "PRESENCE" && realtimeEvent.userId) {
          setOnlineUserIds((current) => {
            const next = new Set(current);
            if (realtimeEvent.online) next.add(realtimeEvent.userId!);
            else next.delete(realtimeEvent.userId!);
            return next;
          });
          return;
        }
        if (realtimeEvent.type === "PRESENCE_SNAPSHOT") {
          setOnlineUserIds(new Set(realtimeEvent.userIds ?? []));
          return;
        }

        if (
          realtimeEvent.type === "TYPING" &&
          realtimeEvent.roomId === activeRoomId &&
          realtimeEvent.userId &&
          realtimeEvent.userId !== user.userId
        ) {
          setTypingUserIds((current) => {
            const next = new Set(current);
            if (realtimeEvent.typing) next.add(realtimeEvent.userId!);
            else next.delete(realtimeEvent.userId!);
            return next;
          });
          return;
        }

        if (realtimeEvent.type === "MESSAGE_CREATED") {
          const message = realtimeEvent.payload as MessageResponse;
          if (realtimeEvent.roomId === activeRoomId) {
            setMessages((current) =>
              current.some((item) => item.id === message.id)
                ? current
                : [...current, message],
            );
          }
          void loadRooms();
          return;
        }

        if (realtimeEvent.type === "MESSAGE_UPDATED") {
          const message = realtimeEvent.payload as MessageResponse;
          if (realtimeEvent.roomId === activeRoomId) {
            setMessages((current) =>
              current.map((item) => (item.id === message.id ? message : item)),
            );
          }
          return;
        }

        if (realtimeEvent.type === "MESSAGE_DELETED") {
          const messageId = Number(realtimeEvent.payload);
          setMessages((current) =>
            current.filter((message) => message.id !== messageId),
          );
          return;
        }

        if (
          realtimeEvent.type === "ROOM_UPDATED" ||
          realtimeEvent.type === "MEMBERS_UPDATED"
        ) {
          if (realtimeEvent.type === "ROOM_UPDATED" && realtimeEvent.payload) {
            const room = realtimeEvent.payload as ChatRoomResponse;
            setRooms((current) =>
              current.map((item) => (item.id === room.id ? room : item)),
            );
          }
          void loadRooms();
          if (groupDetailsOpen && activeRoomId) {
            void socialService
              .getChatRoomMembers(activeRoomId)
              .then((members) => {
                setGroupMembers(members);
                return loadProfiles(members.map((member) => member.userId));
              })
              .catch(() => undefined);
          }
        }
      } catch {
        // Ignore malformed realtime events and keep the REST fallback active.
      }
    };
    socket.onclose = () => {
      if (!disposed) {
        window.setTimeout(
          () => setSocketVersion((current) => current + 1),
          2000,
        );
      }
    };

    return () => {
      disposed = true;
      socket.close();
      socketRef.current = null;
    };
  }, [
    activeRoomId,
    groupDetailsOpen,
    loadProfiles,
    loadRooms,
    socketVersion,
    user?.userId,
  ]);

  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? null;
  const searchTerm = messageSearchQuery.trim();
  const showingMessageSearch = Boolean(searchTerm);
  const visibleMessages = showingMessageSearch ? messageSearchResults : messages;
  const pinnedMessage = activeRoom?.pinnedMessage ?? null;
  const filteredRooms = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return rooms;
    return rooms.filter((room) =>
      roomTitle(room, profiles).toLocaleLowerCase("tr-TR").includes(normalized),
    );
  }, [profiles, query, rooms]);
  const unreadTotal = rooms.reduce((sum, room) => sum + (room.unreadCount ?? 0), 0);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || !activeRoomId || sending) return;
    setSending(true);
    try {
      const created = await socialService.sendMessage({
        chatRoomId: activeRoomId,
        content,
        replyToMessageId: replyingTo?.id,
      });
      setMessages((current) =>
        current.some((message) => message.id === created.id)
          ? current
          : [...current, created],
      );
      setDraft("");
      setReplyingTo(null);
      setEmojiOpen(false);
      sendTyping(false);
      await loadRooms();
    } catch (err) {
      setError(getErrorMessage(err, "Mesaj gönderilemedi."));
    } finally {
      setSending(false);
    }
  }

  function sendTyping(typing: boolean) {
    if (!activeRoomId || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(
      JSON.stringify({ type: "TYPING", roomId: activeRoomId, typing }),
    );
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    sendTyping(Boolean(value.trim()));
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(
      () => sendTyping(false),
      TYPING_IDLE_MS,
    );
  }

  async function sendMessageMedia(file?: File) {
    if (!file || !activeRoomId || uploadingMessageMedia) return;
    setUploadingMessageMedia(true);
    setError(null);
    try {
      const upload = file.type.startsWith("video/")
        ? await socialService.uploadVideo(file)
        : file.type.startsWith("image/")
          ? await socialService.uploadImage(file)
          : await socialService.uploadFile(file);
      const created = await socialService.sendMessage({
        chatRoomId: activeRoomId,
        content: draft.trim() || undefined,
        mediaUrl: upload.imageUrl,
        replyToMessageId: replyingTo?.id,
      });
      setMessages((current) =>
        current.some((message) => message.id === created.id)
          ? current
          : [...current, created],
      );
      setDraft("");
      setReplyingTo(null);
      await loadRooms();
    } catch (err) {
      setError(getErrorMessage(err, "Medya gönderilemedi."));
    } finally {
      setUploadingMessageMedia(false);
      if (messageMediaInputRef.current) messageMediaInputRef.current.value = "";
    }
  }

  async function toggleReaction(messageId: number, emoji: string) {
    try {
      const updated = await socialService.toggleMessageReaction(messageId, emoji);
      setMessages((current) =>
        current.map((message) => (message.id === messageId ? updated : message)),
      );
      setReactionMessageId(null);
    } catch (err) {
      setError(getErrorMessage(err, "Tepki gönderilemedi."));
    }
  }

  async function deleteMessage(messageId: number) {
    if (!window.confirm("Mesaj silinsin mi?")) return;
    try {
      await socialService.deleteMessage(messageId);
      setMessages((current) =>
        current.filter((message) => message.id !== messageId),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Mesaj silinemedi."));
    }
  }

  async function searchMessages() {
    if (!activeRoomId || !searchTerm) {
      setMessageSearchResults([]);
      return;
    }

    setMessageSearchLoading(true);
    setError(null);
    try {
      const results = await socialService.searchChatRoomMessages(
        activeRoomId,
        searchTerm,
        { page: 0, size: 40 },
      );
      setMessageSearchResults(results);
      await loadProfiles(results.map((message) => message.senderUserId));
    } catch (err) {
      setError(getErrorMessage(err, "Mesajlarda arama yapÄ±lamadÄ±."));
    } finally {
      setMessageSearchLoading(false);
    }
  }

  function clearMessageSearch() {
    setMessageSearchQuery("");
    setMessageSearchResults([]);
  }

  async function pinMessage(message: MessageResponse) {
    if (!activeRoomId) return;
    try {
      const updated = await socialService.pinMessage(activeRoomId, message.id);
      setRooms((current) =>
        current.map((room) => (room.id === updated.id ? updated : room)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Mesaj sabitlenemedi."));
    }
  }

  async function unpinMessage() {
    if (!activeRoomId) return;
    try {
      const updated = await socialService.unpinMessage(activeRoomId);
      setRooms((current) =>
        current.map((room) => (room.id === updated.id ? updated : room)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Sabit mesaj kaldÄ±rÄ±lamadÄ±."));
    }
  }

  async function loadFriends() {
    if (!user?.userId) return;
    setError(null);
    try {
      const friendships = await socialService.getFriends(user.userId);
      const ids = Array.from(
        new Set(
          friendships.map((friendship) =>
            friendship.userId === user.userId
              ? friendship.friendUserId
              : friendship.userId,
          ),
        ),
      );
      setFriendIds(ids);
      await loadProfiles(ids);
    } catch (err) {
      setError(getErrorMessage(err, "Arkadaş listesi yüklenemedi."));
    }
  }

  async function openGroupForm() {
    setDirectFormOpen(false);
    setGroupFormOpen(true);
    await loadFriends();
  }

  async function openDirectForm() {
    setGroupFormOpen(false);
    setDirectFormOpen(true);
    await loadFriends();
  }

  function closeGroupForm() {
    setGroupFormOpen(false);
    setGroupName("");
    setSelectedFriendIds(new Set());
  }

  function closeDirectForm() {
    setDirectFormOpen(false);
  }

  function toggleGroupMember(userId: number) {
    setSelectedFriendIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function createGroup() {
    const name = groupName.trim();
    if (!name || selectedFriendIds.size === 0 || creatingGroup) return;
    setCreatingGroup(true);
    setError(null);
    try {
      const room = await socialService.createChatRoom({
        roomName: name,
        roomType: "GROUP",
        participantUserIds: Array.from(selectedFriendIds),
      });
      await loadRooms();
      closeGroupForm();
      setActiveRoomId(room.id);
    } catch (err) {
      setError(getErrorMessage(err, "Grup oluşturulamadı."));
    } finally {
      setCreatingGroup(false);
    }
  }

  async function startDirectChat(friendId: number) {
    if (startingChat) return;
    const profile = profiles.get(friendId);
    setStartingChat(true);
    setError(null);
    try {
      const room = await socialService.findOrCreateDirectChatRoom({
        targetUserId: friendId,
        targetUsername: profile?.username,
      });
      await loadRooms();
      closeDirectForm();
      setActiveRoomId(room.id);
    } catch (err) {
      setError(getErrorMessage(err, "Sohbet başlatılamadı."));
    } finally {
      setStartingChat(false);
    }
  }

  async function updateGroupImage(file?: File) {
    if (
      !file ||
      !activeRoom ||
      activeRoom.roomType !== "GROUP" ||
      !groupMembers.some(
        (member) =>
          member.userId === user?.userId &&
          (member.role === "OWNER" || member.role === "ADMIN"),
      ) ||
      uploadingGroupImage
    ) {
      return;
    }

    setUploadingGroupImage(true);
    setError(null);
    try {
      const uploaded = await socialService.uploadImage(file);
      const updated = await socialService.updateChatRoom(activeRoom.id, {
        imageUrl: uploaded.imageUrl,
      });
      setRooms((current) =>
        current.map((room) => (room.id === updated.id ? updated : room)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Grup fotoğrafı güncellenemedi."));
    } finally {
      setUploadingGroupImage(false);
      if (groupImageInputRef.current) groupImageInputRef.current.value = "";
    }
  }

  function openUserProfile(userId: number) {
    const username = profiles.get(userId)?.username;
    if (!username) return;
    setGroupDetailsOpen(false);
    navigate(ROUTES.profile.replace(":username", username));
  }

  function openDirectParticipantProfile() {
    if (activeRoom?.otherParticipantUserId) {
      openUserProfile(activeRoom.otherParticipantUserId);
    }
  }

  async function openGroupDetails() {
    if (!activeRoom || activeRoom.roomType !== "GROUP") return;
    setGroupDetailsOpen(true);
    setGroupDetailsLoading(true);
    setGroupNameDraft(activeRoom.roomName ?? "");
    setError(null);
    try {
      const [members] = await Promise.all([
        socialService.getChatRoomMembers(activeRoom.id),
        loadFriends(),
      ]);
      setGroupMembers(members);
      await loadProfiles(members.map((member) => member.userId));
    } catch (err) {
      setError(getErrorMessage(err, "Grup bilgileri yüklenemedi."));
    } finally {
      setGroupDetailsLoading(false);
    }
  }

  async function addGroupMember(userId: number) {
    if (!activeRoom || memberActionId) return;
    setMemberActionId(userId);
    try {
      const member = await socialService.addChatRoomMember(activeRoom.id, userId);
      setGroupMembers((current) => [...current, member]);
    } catch (err) {
      setError(getErrorMessage(err, "Üye gruba eklenemedi."));
    } finally {
      setMemberActionId(null);
    }
  }

  async function removeGroupMember(userId: number) {
    if (!activeRoom || memberActionId) return;
    const profile = profiles.get(userId);
    const name = profile?.displayName?.trim() || profile?.username || `Oyuncu #${userId}`;
    if (!window.confirm(`${name} gruptan çıkarılsın mı?`)) return;

    setMemberActionId(userId);
    try {
      await socialService.removeChatRoomMember(activeRoom.id, userId);
      setGroupMembers((current) =>
        current.filter((member) => member.userId !== userId),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Üye gruptan çıkarılamadı."));
    } finally {
      setMemberActionId(null);
    }
  }

  async function saveGroupName() {
    if (!activeRoom || !groupNameDraft.trim()) return;
    try {
      const updated = await socialService.updateChatRoom(activeRoom.id, {
        roomName: groupNameDraft.trim(),
        imageUrl: activeRoom.imageUrl,
      });
      setRooms((current) =>
        current.map((room) => (room.id === updated.id ? updated : room)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Grup adı güncellenemedi."));
    }
  }

  async function removeGroupImage() {
    if (!activeRoom) return;
    try {
      const updated = await socialService.updateChatRoom(activeRoom.id, {
        roomName: activeRoom.roomName ?? undefined,
        imageUrl: "",
      });
      setRooms((current) =>
        current.map((room) => (room.id === updated.id ? updated : room)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Grup fotoğrafı kaldırılamadı."));
    }
  }

  async function updateGroupMemberRole(
    userId: number,
    role: "ADMIN" | "MEMBER",
  ) {
    setMemberActionId(userId);
    try {
      const updated = await socialService.updateChatRoomMemberRole(
        activeRoom!.id,
        userId,
        role,
      );
      setGroupMembers((current) =>
        current.map((member) => (member.userId === userId ? updated : member)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Üye rolü güncellenemedi."));
    } finally {
      setMemberActionId(null);
    }
  }

  async function transferGroupOwnership(userId: number) {
    if (!activeRoom || !window.confirm("Grup sahipliği bu üyeye devredilsin mi?")) return;
    setMemberActionId(userId);
    try {
      const updated = await socialService.transferChatRoomOwnership(
        activeRoom.id,
        userId,
      );
      setRooms((current) =>
        current.map((room) => (room.id === updated.id ? updated : room)),
      );
      await openGroupDetails();
    } catch (err) {
      setError(getErrorMessage(err, "Grup sahipliği devredilemedi."));
    } finally {
      setMemberActionId(null);
    }
  }

  async function leaveGroup() {
    if (!activeRoom || !window.confirm("Bu gruptan ayrılmak istiyor musun?")) return;
    try {
      await socialService.leaveChatRoom(activeRoom.id);
      setRooms((current) => current.filter((room) => room.id !== activeRoom.id));
      setGroupDetailsOpen(false);
      setActiveRoomId(null);
    } catch (err) {
      setError(getErrorMessage(err, "Gruptan ayrılamadın."));
    }
  }

  if (!isOpen) {
    return (
      <button
        aria-label="Sohbeti aç"
        className="fixed bottom-5 right-5 z-[80] flex h-14 items-center gap-3 rounded-full border border-violet-400/30 bg-[#111827]/95 px-5 text-sm font-bold text-white shadow-2xl shadow-black/50 backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-300/60"
        onClick={() => openChat()}
        type="button"
      >
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600">
          <MessageCircle className="h-5 w-5" />
          {unreadTotal > 0 ? (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px]">
              {unreadTotal > 9 ? "9+" : unreadTotal}
            </span>
          ) : null}
        </span>
        <span className="hidden sm:inline">Sohbet</span>
      </button>
    );
  }

  const groupMemberIds = new Set(groupMembers.map((member) => member.userId));
  const addableFriendIds = friendIds.filter(
    (friendId) => !groupMemberIds.has(friendId),
  );
  const currentGroupMember = groupMembers.find(
    (member) => member.userId === user?.userId,
  );
  const canManageGroup =
    currentGroupMember?.role === "OWNER" ||
    currentGroupMember?.role === "ADMIN";

  return (
    <>
    <aside className="fixed bottom-0 right-3 z-[80] flex h-[min(620px,calc(100vh-88px))] w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0a101c]/98 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:bottom-4 sm:right-5 sm:rounded-2xl">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10 px-4">
        <div className="flex min-w-0 items-center gap-3">
          {activeRoom || groupFormOpen || directFormOpen ? (
            <button
              aria-label={
                groupFormOpen
                  ? "Grup oluşturmayı kapat"
                  : directFormOpen
                    ? "Yeni sohbeti kapat"
                    : "Sohbet listesine dön"
              }
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-zinc-300 hover:bg-white/10"
              onClick={() => {
                if (groupFormOpen) closeGroupForm();
                else if (directFormOpen) closeDirectForm();
                else setActiveRoomId(null);
              }}
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600">
              <MessageCircle className="h-5 w-5 text-white" />
            </span>
          )}
          {activeRoom ? (
            <button
              className="flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 text-left transition hover:bg-white/[0.05]"
              onClick={() => {
                if (activeRoom.roomType === "GROUP") void openGroupDetails();
                else openDirectParticipantProfile();
              }}
              type="button"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-fuchsia-600/70 to-violet-700/70 text-white">
                {activeRoom.roomType === "GROUP" ? (
                  groupImageUrl(activeRoom) ? (
                    <img
                      alt={roomTitle(activeRoom, profiles)}
                      className="h-full w-full object-cover"
                      src={groupImageUrl(activeRoom) ?? undefined}
                    />
                  ) : (
                    <UsersRound className="h-5 w-5" />
                  )
                ) : avatarUrl(activeRoom.otherParticipantUserId, profiles) ? (
                  <img
                    alt={roomTitle(activeRoom, profiles)}
                    className="h-full w-full object-cover"
                    src={avatarUrl(activeRoom.otherParticipantUserId, profiles) ?? undefined}
                  />
                ) : (
                  roomTitle(activeRoom, profiles).charAt(0).toLocaleUpperCase("tr-TR")
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-black text-white">
                  {roomTitle(activeRoom, profiles)}
                </span>
                <span className="block truncate text-[11px] text-zinc-400">
                  {activeRoom.roomType === "GROUP"
                    ? "Grup bilgilerini aç"
                    : activeRoom.otherParticipantUserId &&
                        onlineUserIds.has(activeRoom.otherParticipantUserId)
                      ? "Çevrimiçi · Profili görüntüle"
                      : "Profili görüntüle"}
                </span>
              </span>
            </button>
          ) : (
          <div className="min-w-0">
            <h2 className="truncate font-black text-white">
              {groupFormOpen
                ? "Yeni grup"
                : directFormOpen
                  ? "Yeni sohbet"
                  : "Mesajlaşma"}
            </h2>
            <p className="truncate text-[11px] text-zinc-400">
              {groupFormOpen
                ? `${selectedFriendIds.size} kişi seçildi`
                : directFormOpen
                  ? "Konuşmak istediğin kişiyi seç"
                  : `${rooms.length} sohbet`}
            </p>
          </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label="Sohbeti küçült"
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-300 hover:bg-white/10"
            onClick={toggleChat}
            type="button"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          <button
            aria-label="Sohbeti kapat"
            className="grid h-9 w-9 place-items-center rounded-full text-zinc-300 hover:bg-rose-500/15 hover:text-rose-200"
            onClick={closeChat}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      {directFormOpen ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="mb-3 rounded-xl border border-violet-400/15 bg-violet-500/[0.06] px-3 py-2.5 text-xs leading-5 text-zinc-400">
            Daha önce konuştuğun birini seçersen mevcut sohbet açılır; yeni bir kişiyse sohbet otomatik oluşturulur.
          </div>
          {error ? <p className="mb-2 text-xs text-amber-300">{error}</p> : null}
          <div className="space-y-1">
            {friendIds.length ? (
              friendIds.map((friendId) => {
                const profile = profiles.get(friendId);
                const name =
                  profile?.displayName?.trim() ||
                  profile?.username ||
                  `Oyuncu #${friendId}`;
                const avatar = avatarUrl(friendId, profiles);
                const existingRoom = rooms.find(
                  (room) =>
                    room.roomType === "DIRECT" &&
                    room.otherParticipantUserId === friendId,
                );
                return (
                  <button
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/[0.05] disabled:opacity-50"
                    disabled={startingChat}
                    key={friendId}
                    onClick={() => void startDirectChat(friendId)}
                    type="button"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500/50 to-fuchsia-500/40 font-bold text-white">
                      {avatar ? (
                        <img alt={name} className="h-full w-full object-cover" src={avatar} />
                      ) : (
                        name.charAt(0).toLocaleUpperCase("tr-TR")
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-zinc-100">
                        {name}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {existingRoom
                          ? "Mevcut sohbeti aç"
                          : profile?.username
                            ? `@${profile.username} ile sohbet başlat`
                            : "Yeni sohbet başlat"}
                      </span>
                    </span>
                    <MessageCircle className="h-4 w-4 shrink-0 text-violet-300" />
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">
                <MessageSquarePlus className="mx-auto h-9 w-9 text-zinc-700" />
                <p className="mt-3 text-sm font-semibold text-zinc-300">
                  Yeni sohbet başlatmak için arkadaş eklemelisin.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : groupFormOpen ? (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Grup adı
              </span>
              <input
                autoFocus
                className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/50"
                maxLength={100}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Örn. Gece Baskını Ekibi"
                value={groupName}
              />
            </label>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Katılımcılar
              </p>
              <span className="text-xs text-violet-300">
                {selectedFriendIds.size} seçili
              </span>
            </div>

            <div className="mt-2 space-y-1">
              {friendIds.length ? (
                friendIds.map((friendId) => {
                  const profile = profiles.get(friendId);
                  const name =
                    profile?.displayName?.trim() ||
                    profile?.username ||
                    `Oyuncu #${friendId}`;
                  const avatar = avatarUrl(friendId, profiles);
                  const selected = selectedFriendIds.has(friendId);
                  return (
                    <button
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        selected
                          ? "border-violet-400/35 bg-violet-500/10"
                          : "border-transparent hover:bg-white/[0.04]"
                      }`}
                      key={friendId}
                      onClick={() => toggleGroupMember(friendId)}
                      type="button"
                    >
                      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500/50 to-fuchsia-500/40 font-bold text-white">
                        {avatar ? (
                          <img alt={name} className="h-full w-full object-cover" src={avatar} />
                        ) : (
                          name.charAt(0).toLocaleUpperCase("tr-TR")
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-zinc-100">
                          {name}
                        </span>
                        {profile?.username ? (
                          <span className="block truncate text-xs text-zinc-500">
                            @{profile.username}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full border ${
                          selected
                            ? "border-violet-400 bg-violet-600 text-white"
                            : "border-white/15 text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 px-5 py-8 text-center">
                  <UsersRound className="mx-auto h-9 w-9 text-zinc-700" />
                  <p className="mt-3 text-sm font-semibold text-zinc-300">
                    Grup oluşturmak için arkadaş eklemelisin.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="shrink-0 border-t border-white/10 bg-[#0b1220] p-3">
            {error ? <p className="mb-2 text-xs text-amber-300">{error}</p> : null}
            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-black text-white transition duration-150 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!groupName.trim() || selectedFriendIds.size === 0 || creatingGroup}
              onClick={() => void createGroup()}
              type="button"
            >
              <UsersRound className="h-4 w-4" />
              {creatingGroup ? "Grup oluşturuluyor..." : "Grubu oluştur"}
            </button>
          </div>
        </>
      ) : activeRoom ? (
        <>
          <div className="shrink-0 space-y-2 border-b border-white/8 bg-[#0b1220] p-3">
            {pinnedMessage ? (
              <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-left">
                <Pin className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    document
                      .getElementById(`chat-message-${pinnedMessage.id}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  type="button"
                >
                  <span className="block text-[10px] font-black uppercase tracking-wider text-amber-200">
                    Sabit mesaj
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-zinc-200">
                    {pinnedMessage.content}
                  </span>
                </button>
                <button
                  aria-label="Sabit mesajÄ± kaldÄ±r"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-amber-200 hover:bg-amber-500/15"
                  onClick={() => void unpinMessage()}
                  type="button"
                >
                  <PinOff className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
            <form
              className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/20 px-3 py-2 focus-within:border-violet-400/40"
              onSubmit={(event) => {
                event.preventDefault();
                void searchMessages();
              }}
            >
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-zinc-600"
                onChange={(event) => setMessageSearchQuery(event.target.value)}
                placeholder="Bu sohbette ara"
                value={messageSearchQuery}
              />
              {showingMessageSearch ? (
                <button
                  className="text-[11px] font-bold text-zinc-400 hover:text-white"
                  onClick={clearMessageSearch}
                  type="button"
                >
                  Temizle
                </button>
              ) : null}
              <button
                className="rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white disabled:opacity-40"
                disabled={!searchTerm || messageSearchLoading}
                type="submit"
              >
                {messageSearchLoading ? "..." : "Ara"}
              </button>
            </form>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.08),transparent_45%)] p-4">
            {loading && messages.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">Mesajlar yükleniyor...</p>
            ) : messageSearchLoading ? (
              <p className="text-center text-sm text-zinc-500">Mesajlarda aranÄ±yor...</p>
            ) : visibleMessages.length ? (
              visibleMessages.map((message) => {
                if (message.messageType === "SYSTEM") {
                  return (
                    <div className="flex justify-center py-1" key={message.id}>
                      <span className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-center text-[10px] font-semibold text-zinc-500">
                        {message.content}
                      </span>
                    </div>
                  );
                }
                const mine = message.senderUserId === user?.userId;
                const senderProfile = profiles.get(message.senderUserId);
                const senderName =
                  senderProfile?.displayName?.trim() ||
                  senderProfile?.username ||
                  `Oyuncu #${message.senderUserId}`;
                const reactions = groupedReactions(message, user?.userId);
                return (
                  <div
                    className={`group flex ${mine ? "justify-end" : "justify-start"}`}
                    id={`chat-message-${message.id}`}
                    key={message.id}
                  >
                    <div className={`relative max-w-[82%] ${mine ? "text-right" : ""}`}>
                      {!mine && activeRoom.roomType === "GROUP" ? (
                        <span className="mb-1 block px-1 text-left text-[10px] font-bold text-violet-300">
                          {senderName}
                        </span>
                      ) : null}
                      <div
                        className={
                          mine
                            ? "rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-violet-700 px-3.5 py-2.5 text-left text-sm text-white"
                            : "rounded-2xl rounded-bl-md border border-white/8 bg-white/[0.06] px-3.5 py-2.5 text-left text-sm text-zinc-100"
                        }
                      >
                        {message.replyToContent ? (
                          <div className="mb-2 rounded-lg border-l-2 border-violet-300/70 bg-black/15 px-2.5 py-1.5">
                            <p className="truncate text-xs text-zinc-300">
                              {message.replyToContent}
                            </p>
                          </div>
                        ) : null}
                        {message.mediaUrl ? (
                          message.mediaType === "VIDEO" ? (
                            <video
                              className="mb-2 max-h-56 w-full rounded-xl bg-black object-contain"
                              controls
                              src={getImageUrl(message.mediaUrl)}
                            />
                          ) : message.mediaType === "FILE" ? (
                            <a
                              className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-3 font-semibold text-violet-200 hover:bg-white/[0.05]"
                              href={getImageUrl(message.mediaUrl)}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <Paperclip className="h-4 w-4" />
                              Dosyayı aç
                            </a>
                          ) : (
                            <img
                              alt="Mesaj görseli"
                              className="mb-2 max-h-56 w-full rounded-xl object-cover"
                              src={getImageUrl(message.mediaUrl)}
                            />
                          )
                        ) : null}
                        {message.content &&
                        !(
                          message.mediaUrl &&
                          (message.content === "Görsel" || message.content === "Video")
                        )
                          ? message.content
                          : null}
                      </div>
                      <div className={`absolute top-full z-20 mt-1 hidden gap-1 group-hover:flex ${mine ? "right-0" : "left-0"}`}>
                        <button
                          aria-label="Yanıtla"
                          className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#101827] text-zinc-300 hover:text-white"
                          onClick={() => setReplyingTo(message)}
                          type="button"
                        >
                          <CornerDownRight className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label="MesajÄ± sabitle"
                          className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#101827] text-amber-300 hover:bg-amber-500/10"
                          onClick={() => void pinMessage(message)}
                          type="button"
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>
                        <div className="relative">
                          <button
                            aria-label="Tepki ver"
                            className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#101827] text-zinc-300 hover:text-white"
                            onClick={() =>
                              setReactionMessageId((current) =>
                                current === message.id ? null : message.id,
                              )
                            }
                            type="button"
                          >
                            <Smile className="h-3.5 w-3.5" />
                          </button>
                          {reactionMessageId === message.id ? (
                            <EmojiPickerPopover
                              className={`absolute bottom-9 z-40 grid w-56 grid-cols-6 gap-1 rounded-xl border border-white/10 bg-[#0b1220] p-2 shadow-2xl ${mine ? "right-0" : "left-0"}`}
                              emojis={QUICK_REACTIONS}
                              onClose={() => setReactionMessageId(null)}
                              onSelect={(emoji) => void toggleReaction(message.id, emoji)}
                            />
                          ) : null}
                        </div>
                        {mine ? (
                          <button
                            aria-label="Mesajı sil"
                            className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-[#101827] text-rose-300 hover:bg-rose-500/10"
                            onClick={() => void deleteMessage(message.id)}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                      {reactions.length ? (
                        <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end" : "justify-start"}`}>
                          {reactions.map((reaction) => (
                            <button
                              className={`rounded-full border px-2 py-0.5 text-[10px] ${reaction.mine ? "border-violet-400/50 bg-violet-500/20 text-violet-100" : "border-white/10 bg-[#101827] text-zinc-300"}`}
                              key={reaction.emoji}
                              onClick={() => void toggleReaction(message.id, reaction.emoji)}
                              type="button"
                            >
                              {reaction.emoji} {reaction.count}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      <span className="mt-1 block text-[10px] text-zinc-600">
                        {formatSocialTime(message.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="grid h-full place-items-center text-center">
                <div>
                  <MessageCircle className="mx-auto h-9 w-9 text-violet-400/70" />
                  <p className="mt-3 text-sm font-semibold text-zinc-300">
                    {showingMessageSearch
                      ? "Eşleşen mesaj bulunamadı."
                      : "İlk mesajı sen gönder."}
                  </p>
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
          </div>
          <div className="shrink-0 border-t border-white/10 bg-[#0b1220] p-3">
            {error ? <p className="mb-2 text-xs text-amber-300">{error}</p> : null}
            {typingUserIds.size > 0 ? (
              <p className="mb-2 text-[11px] font-semibold text-violet-300">
                {Array.from(typingUserIds)
                  .map((id) => profiles.get(id)?.displayName || profiles.get(id)?.username || "Birisi")
                  .join(", ")} yazıyor...
              </p>
            ) : null}
            {replyingTo ? (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2">
                <p className="min-w-0 truncate text-xs text-zinc-300">
                  Yanıt: {replyingTo.content}
                </p>
                <button onClick={() => setReplyingTo(null)} type="button">
                  <X className="h-4 w-4 text-zinc-400" />
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1.5 focus-within:border-violet-400/50">
              <button
                aria-label="Dosya veya medya ekle"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                disabled={uploadingMessageMedia}
                onClick={() => messageMediaInputRef.current?.click()}
                type="button"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                accept="image/*,video/*,.pdf,.txt,.zip,.7z,.docx,.xlsx,.pptx"
                className="hidden"
                onChange={(event) => void sendMessageMedia(event.target.files?.[0])}
                ref={messageMediaInputRef}
                type="file"
              />
              <input
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-zinc-600"
                disabled={sending}
                maxLength={1000}
                onChange={(event) => handleDraftChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void sendMessage();
                }}
                placeholder="Mesaj yaz..."
                value={draft}
              />
              <div className="relative">
                <button
                  aria-label="Emoji ekle"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                  onClick={() => setEmojiOpen((current) => !current)}
                  type="button"
                >
                  <Smile className="h-4 w-4" />
                </button>
                {emojiOpen ? (
                  <EmojiPickerPopover
                    className="absolute bottom-11 right-0 z-40 grid w-56 grid-cols-6 gap-1 rounded-xl border border-white/10 bg-[#0b1220] p-2 shadow-2xl"
                    emojis={DEFAULT_EMOJIS}
                    onClose={() => setEmojiOpen(false)}
                    onSelect={(emoji) => handleDraftChange(`${draft}${emoji}`)}
                  />
                ) : null}
              </div>
              <button
                aria-label="Mesaj gönder"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-600 text-white disabled:opacity-40"
                disabled={!draft.trim() || sending}
                onClick={() => void sendMessage()}
                type="button"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 border-b border-white/8 p-3">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2.5 focus-within:border-violet-400/40">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Mesajlarda ara"
                value={query}
              />
            </label>
            <button
              aria-label="Yeni sohbet oluştur"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-200 transition hover:bg-violet-500/20"
              onClick={() => void openDirectForm()}
              title="Yeni sohbet oluştur"
              type="button"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </button>
            <button
              aria-label="Yeni grup oluştur"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200 transition hover:bg-fuchsia-500/20"
              onClick={() => void openGroupForm()}
              title="Yeni grup oluştur"
              type="button"
            >
              <UsersRound className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading ? (
              <p className="p-5 text-center text-sm text-zinc-500">Sohbetler yükleniyor...</p>
            ) : filteredRooms.length ? (
              filteredRooms.map((room) => {
                const title = roomTitle(room, profiles);
                const avatar =
                  room.roomType === "GROUP"
                    ? groupImageUrl(room)
                    : avatarUrl(room.otherParticipantUserId, profiles);
                return (
                  <button
                    className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-white/[0.05]"
                    key={room.id}
                    onClick={() => setActiveRoomId(room.id)}
                    type="button"
                  >
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500/50 to-fuchsia-500/40 font-black text-white">
                      {avatar ? (
                        <img alt={title} className="h-full w-full object-cover" src={avatar} />
                      ) : room.roomType === "GROUP" ? (
                        <UsersRound className="h-5 w-5" />
                      ) : (
                        title.charAt(0).toLocaleUpperCase("tr-TR")
                      )}
                      {room.roomType === "DIRECT" ? (
                        <span
                          className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0a101c] ${
                            room.otherParticipantUserId &&
                            onlineUserIds.has(room.otherParticipantUserId)
                              ? "bg-emerald-400"
                              : "bg-zinc-600"
                          }`}
                        />
                      ) : (
                        <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full border-2 border-[#0a101c] bg-fuchsia-600">
                          <UsersRound className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-bold text-zinc-100">
                          <span className="truncate">{title}</span>
                          {room.roomType === "GROUP" ? (
                            <span className="shrink-0 rounded-full bg-fuchsia-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-fuchsia-300">
                              Grup
                            </span>
                          ) : null}
                        </span>
                        {room.lastMessageAt ? <span className="text-[10px] text-zinc-600">{formatSocialTime(room.lastMessageAt)}</span> : null}
                      </span>
                      <span className="mt-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-zinc-500">{room.lastMessageContent || "Yeni bir sohbet başlat"}</span>
                        {(room.unreadCount ?? 0) > 0 ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">{room.unreadCount}</span> : null}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="grid h-full place-items-center px-8 text-center">
                <div>
                  <MessageCircle className="mx-auto h-10 w-10 text-zinc-700" />
                  <p className="mt-3 text-sm font-semibold text-zinc-300">Henüz sohbet yok</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">Bir kullanıcı profilinden mesajlaşmayı başlatabilirsin.</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </aside>
    {groupDetailsOpen && activeRoom?.roomType === "GROUP" ? (
      <div
        className="fixed inset-0 z-[110] grid place-items-center bg-black/75 p-4 backdrop-blur-md"
        onClick={() => setGroupDetailsOpen(false)}
        role="presentation"
      >
        <section
          aria-modal="true"
          className="max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-fuchsia-400/20 bg-[#090d17] shadow-2xl shadow-black/70"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
        >
          <div className="relative overflow-hidden border-b border-white/8 bg-gradient-to-br from-fuchsia-500/15 to-violet-500/10 p-6">
            <button
              aria-label="Grup bilgilerini kapat"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/25 text-zinc-300 hover:bg-white/10"
              onClick={() => setGroupDetailsOpen(false)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-fuchsia-400/30 bg-gradient-to-br from-fuchsia-600 to-violet-700 text-white shadow-xl">
                  {groupImageUrl(activeRoom) ? (
                    <img
                      alt={roomTitle(activeRoom, profiles)}
                      className="h-full w-full object-cover"
                      src={groupImageUrl(activeRoom) ?? undefined}
                    />
                  ) : (
                    <UsersRound className="h-9 w-9" />
                  )}
                </span>
                {canManageGroup ? (
                  <button
                    aria-label="Grup fotoğrafını değiştir"
                    className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full border-2 border-[#090d17] bg-fuchsia-600 text-white hover:bg-fuchsia-500 disabled:opacity-50"
                    disabled={uploadingGroupImage}
                    onClick={() => groupImageInputRef.current?.click()}
                    type="button"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-300">
                  Grup sohbeti
                </p>
                <h2 className="mt-1 truncate text-2xl font-black text-white">
                  {roomTitle(activeRoom, profiles)}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {groupMembers.length} üye
                </p>
              </div>
            </div>
            <input
              accept="image/*"
              className="hidden"
              onChange={(event) => void updateGroupImage(event.target.files?.[0])}
              ref={groupImageInputRef}
              type="file"
            />
          </div>

          <div className="space-y-6 p-6">
            {error ? <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-200">{error}</p> : null}
            {canManageGroup ? (
              <div className="space-y-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Grup adı
                  </span>
                  <div className="mt-2 flex gap-2">
                    <input
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/50"
                      maxLength={100}
                      onChange={(event) => setGroupNameDraft(event.target.value)}
                      value={groupNameDraft}
                    />
                    <button
                      className="rounded-xl bg-violet-600 px-4 text-sm font-bold text-white disabled:opacity-40"
                      disabled={!groupNameDraft.trim()}
                      onClick={() => void saveGroupName()}
                      type="button"
                    >
                      Kaydet
                    </button>
                  </div>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg border border-fuchsia-400/25 px-3 py-2 text-xs font-bold text-fuchsia-200"
                    onClick={() => groupImageInputRef.current?.click()}
                    type="button"
                  >
                    Fotoğrafı değiştir
                  </button>
                  {activeRoom.imageUrl ? (
                    <button
                      className="rounded-lg border border-rose-400/25 px-3 py-2 text-xs font-bold text-rose-200"
                      onClick={() => void removeGroupImage()}
                      type="button"
                    >
                      Fotoğrafı kaldır
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-black text-white">Grup üyeleri</h3>
                <span className="text-xs text-zinc-500">{groupMembers.length} kişi</span>
              </div>
              {groupDetailsLoading ? (
                <p className="text-sm text-zinc-500">Üyeler yükleniyor...</p>
              ) : (
                <div className="space-y-2">
                  {groupMembers.map((member) => {
                    const profile = profiles.get(member.userId);
                    const name = profile?.displayName?.trim() || profile?.username || `Oyuncu #${member.userId}`;
                    const avatar = avatarUrl(member.userId, profiles);
                    return (
                      <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3" key={member.userId}>
                        <button
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          onClick={() => openUserProfile(member.userId)}
                          type="button"
                        >
                          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-violet-600/50 font-bold text-white">
                            {avatar ? <img alt={name} className="h-full w-full object-cover" src={avatar} /> : name.charAt(0).toLocaleUpperCase("tr-TR")}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-white">{name}</span>
                            <span className="block truncate text-xs text-zinc-500">
                              {member.role === "OWNER"
                                ? "Grup sahibi"
                                : member.role === "ADMIN"
                                  ? "Yönetici"
                                  : profile?.username
                                    ? `@${profile.username}`
                                    : "Üye"}
                            </span>
                          </span>
                        </button>
                        {member.role === "OWNER" ? (
                          <Crown className="h-5 w-5 text-amber-400" />
                        ) : canManageGroup ? (
                          <div className="flex gap-1">
                            {currentGroupMember?.role === "OWNER" ? (
                              <>
                                <button
                                  aria-label={member.role === "ADMIN" ? "Yöneticilikten çıkar" : "Yönetici yap"}
                                  className="grid h-9 w-9 place-items-center rounded-lg text-violet-300 hover:bg-violet-500/10 disabled:opacity-40"
                                  disabled={memberActionId === member.userId}
                                  onClick={() =>
                                    void updateGroupMemberRole(
                                      member.userId,
                                      member.role === "ADMIN" ? "MEMBER" : "ADMIN",
                                    )
                                  }
                                  title={member.role === "ADMIN" ? "Yöneticilikten çıkar" : "Yönetici yap"}
                                  type="button"
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                </button>
                                <button
                                  aria-label="Sahipliği devret"
                                  className="grid h-9 w-9 place-items-center rounded-lg text-amber-300 hover:bg-amber-500/10 disabled:opacity-40"
                                  disabled={memberActionId === member.userId}
                                  onClick={() => void transferGroupOwnership(member.userId)}
                                  title="Sahipliği devret"
                                  type="button"
                                >
                                  <Crown className="h-4 w-4" />
                                </button>
                              </>
                            ) : null}
                            {(currentGroupMember?.role === "OWNER" ||
                              member.role === "MEMBER") ? (
                              <button
                                aria-label={`${name} kullanıcısını gruptan çıkar`}
                                className="grid h-9 w-9 place-items-center rounded-lg text-rose-300 hover:bg-rose-500/10 disabled:opacity-40"
                                disabled={memberActionId === member.userId}
                                onClick={() => void removeGroupMember(member.userId)}
                                type="button"
                              >
                                <UserMinus className="h-4 w-4" />
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {canManageGroup ? (
              <div>
                <h3 className="mb-3 font-black text-white">Üye ekle</h3>
                {addableFriendIds.length ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {addableFriendIds.map((friendId) => {
                      const profile = profiles.get(friendId);
                      const name = profile?.displayName?.trim() || profile?.username || `Oyuncu #${friendId}`;
                      return (
                        <button
                          className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-left hover:border-violet-400/30"
                          disabled={memberActionId === friendId}
                          key={friendId}
                          onClick={() => void addGroupMember(friendId)}
                          type="button"
                        >
                          <UserPlus className="h-4 w-4 shrink-0 text-violet-300" />
                          <span className="truncate text-sm font-semibold text-zinc-200">{name}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">
                    Eklenebilecek başka arkadaş bulunmuyor.
                  </p>
                )}
              </div>
            ) : null}

            <div className="border-t border-white/8 pt-5">
              <button
                className="w-full rounded-xl border border-rose-500/30 px-4 py-3 text-sm font-bold text-rose-200 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={currentGroupMember?.role === "OWNER"}
                onClick={() => void leaveGroup()}
                type="button"
              >
                {currentGroupMember?.role === "OWNER"
                  ? "Ayrılmak için önce sahipliği devret"
                  : "Gruptan ayrıl"}
              </button>
            </div>
          </div>
        </section>
      </div>
    ) : null}
    </>
  );
}
