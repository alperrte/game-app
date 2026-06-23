import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  GripVertical,
  ImageIcon,
  ListFilter,
  Mic,
  Plus,
  Search,
  Smile,
  Tag,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "../../../components/ui/Button";
import { UserAvatar } from "../../user/components/UserAvatar";
import { ConfirmModal } from "../../../components/modal/ConfirmModal";
import {
  DEFAULT_EMOJIS,
  EmojiPickerPopover,
} from "../../../components/ui/EmojiPickerPopover";
import type { Game } from "../../game/types/gameTypes";
import type { GamePlatform } from "../../game/types/gameTypes";
import type { Community } from "../../community/types/community.types";
import type {
  ComposerMediaType,
  ComposerSubmitPayload,
  LookingForPlayerCreateRequest,
  PostVisibility,
  SocialUser,
} from "../types/social.types";

const VISIBILITY_OPTIONS: Array<{
  value: PostVisibility;
  label: string;
}> = [
  { value: "PUBLIC", label: "Herkes görebilir" },
  { value: "FOLLOWERS_ONLY", label: "Yalnızca takipçilerim" },
  { value: "FRIENDS", label: "Yalnızca arkadaşlarım" },
  { value: "PRIVATE", label: "Yalnızca ben" },
];

type ComposerMode = "post" | "poll" | "game" | "listing";

interface PollOption {
  id: string;
  value: string;
}

function createPollOption(value = ""): PollOption {
  return {
    id: `poll-${crypto.randomUUID()}`,
    value,
  };
}

function createDefaultPollOptions(): PollOption[] {
  return [createPollOption(), createPollOption()];
}

const MAX_IMAGE_SIZE_MB = 10;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
const MAX_IMAGE_COUNT = 3;
const GAMES_PER_PICKER_PAGE = 50;
const VIDEO_FILE_ACCEPT = "video/mp4,video/webm,video/ogg";
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/ogg"]);

interface SelectedMedia {
  file: File;
  previewUrl: string;
  type: ComposerMediaType;
}

interface SocialComposerProps {
  games: Game[];
  platforms: GamePlatform[];
  communities: Community[];
  user: SocialUser;
  isSubmitting?: boolean;
  onCreateLookingForPlayer: (
      request: LookingForPlayerCreateRequest,
  ) => Promise<void>;
  onSubmit: (payload: ComposerSubmitPayload) => Promise<void>;
  uploadProgress?: number | null;
}

export function SocialComposer({
                                 games,
                                 platforms,
                                 communities,
                                 user,
                                 isSubmitting = false,
                                 onCreateLookingForPlayer,
                                 onSubmit,
                                 uploadProgress = null,
                               }: SocialComposerProps) {
  const [content, setContent] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState("");
  const [selectedVisibility, setSelectedVisibility] =
    useState<PostVisibility>("PUBLIC");
  const [mode, setMode] = useState<ComposerMode>("post");
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([]);
  const [previewModalIndex, setPreviewModalIndex] = useState<number | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pollOptionEmojiOpenId, setPollOptionEmojiOpenId] = useState<string | null>(null);
  const [draggedPollOptionId, setDraggedPollOptionId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState<"game" | "listingGame" | "platform" | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [gamePickerPage, setGamePickerPage] = useState(1);
  const [fileAccept, setFileAccept] = useState("image/*");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<PollOption[]>(createDefaultPollOptions);
  const [pollDurationMinutes, setPollDurationMinutes] = useState(1440);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [listingForm, setListingForm] = useState({
    gameId: "",
    title: "",
    description: "",
    platform: "",
    preferredRole: "",
    playerLevel: "",
    microphoneRequired: false,
    playTime: "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const playTimeInputRef = useRef<HTMLInputElement | null>(null);
  const fileModeRef = useRef<ComposerMediaType>("image");
  const selectedMediaRef = useRef<SelectedMedia[]>([]);
  const hasSelectedImage = selectedMedia.some((media) => media.type === "image");
  const hasSelectedVideo = selectedMedia.some((media) => media.type === "video");
  const previewMedia =
      previewModalIndex === null ? null : selectedMedia[previewModalIndex] ?? null;
  const gameOptions = useMemo(
      () => (Array.isArray(games) ? games : []),
      [games],
  );
  const platformOptions = useMemo(
      () => (Array.isArray(platforms) ? platforms : []),
      [platforms],
  );
  const selectedGame = useMemo(
      () => gameOptions.find((game) => String(game.id) === selectedGameId) ?? null,
      [gameOptions, selectedGameId],
  );
  const selectedListingGame = useMemo(
      () => gameOptions.find((game) => String(game.id) === listingForm.gameId) ?? null,
      [gameOptions, listingForm.gameId],
  );
  const selectedListingPlatform = useMemo(
      () =>
          platformOptions.find(
              (platform) =>
                  platform.name.toLocaleLowerCase("tr") ===
                  listingForm.platform.toLocaleLowerCase("tr"),
          ) ?? null,
      [listingForm.platform, platformOptions],
  );
  const filteredGames = useMemo(() => {
    const query = pickerQuery.trim().toLocaleLowerCase("tr");

    if (!query) return gameOptions;

    return gameOptions.filter((game) =>
        [game.title, game.genre, game.platform, game.categoryName]
            .filter(Boolean)
            .some((value) => value!.toLocaleLowerCase("tr").includes(query)),
    );
  }, [gameOptions, pickerQuery]);
  const filteredPlatforms = useMemo(() => {
    const query = pickerQuery.trim().toLocaleLowerCase("tr");

    if (!query) return platformOptions;

    return platformOptions.filter((platform) =>
        [platform.name, platform.description, platform.source]
            .filter(Boolean)
            .some((value) => value!.toLocaleLowerCase("tr").includes(query)),
    );
  }, [pickerQuery, platformOptions]);
  const gamePickerTotalPages = useMemo(
      () => Math.max(1, Math.ceil(filteredGames.length / GAMES_PER_PICKER_PAGE)),
      [filteredGames.length],
  );
  const pagedGames = useMemo(() => {
    const startIndex = (gamePickerPage - 1) * GAMES_PER_PICKER_PAGE;

    return filteredGames.slice(startIndex, startIndex + GAMES_PER_PICKER_PAGE);
  }, [filteredGames, gamePickerPage]);
  const gamePickerPageButtons = useMemo(() => {
    const pages = [
      1,
      gamePickerPage - 1,
      gamePickerPage,
      gamePickerPage + 1,
      gamePickerTotalPages,
    ].filter((page) => page >= 1 && page <= gamePickerTotalPages);

    return Array.from(new Set(pages));
  }, [gamePickerPage, gamePickerTotalPages]);

  const changePreviewMedia = useCallback(
      (direction: number) => {
        setPreviewModalIndex((currentIndex) => {
          if (currentIndex === null || selectedMedia.length === 0) {
            return currentIndex;
          }

          return (
              (currentIndex + direction + selectedMedia.length) %
              selectedMedia.length
          );
        });
      },
      [selectedMedia.length],
  );

  useEffect(() => {
    selectedMediaRef.current = selectedMedia;
  }, [selectedMedia]);

  useEffect(() => {
    if (!pickerOpen || pickerOpen === "platform") return;

    Promise.resolve().then(() => {
      setGamePickerPage(1);
    });
  }, [pickerOpen, pickerQuery]);

  useEffect(() => {
    if (gamePickerPage <= gamePickerTotalPages) return;

    Promise.resolve().then(() => {
      setGamePickerPage(gamePickerTotalPages);
    });
  }, [gamePickerPage, gamePickerTotalPages]);

  useEffect(() => {
    return () => {
      selectedMediaRef.current.forEach((media) =>
          URL.revokeObjectURL(media.previewUrl),
      );
    };
  }, []);

  useEffect(() => {
    if (previewModalIndex === null) return;

    if (selectedMedia.length === 0) {
      Promise.resolve().then(() => {
        setPreviewModalIndex(null);
      });
      return;
    }

    if (previewModalIndex >= selectedMedia.length) {
      Promise.resolve().then(() => {
        setPreviewModalIndex(selectedMedia.length - 1);
      });
    }
  }, [previewModalIndex, selectedMedia.length]);

  useEffect(() => {
    if (previewModalIndex === null) return undefined;

    function handlePreviewKeydown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setPreviewModalIndex(null);
        return;
      }

      if (event.key === "ArrowRight") {
        changePreviewMedia(1);
        return;
      }

      if (event.key === "ArrowLeft") {
        changePreviewMedia(-1);
      }
    }

    window.addEventListener("keydown", handlePreviewKeydown);

    return () => {
      window.removeEventListener("keydown", handlePreviewKeydown);
    };
  }, [previewModalIndex, changePreviewMedia]);

  function chooseFile(type: ComposerMediaType) {
    const nextAccept = type === "video" ? VIDEO_FILE_ACCEPT : "image/*";

    fileModeRef.current = type;
    setFileAccept(nextAccept);
    if (fileInputRef.current) {
      fileInputRef.current.accept = nextAccept;
      fileInputRef.current.multiple = type === "image";
    }
    fileInputRef.current?.click();
  }

  function openPlayTimePicker() {
    playTimeInputRef.current?.showPicker?.();
    playTimeInputRef.current?.focus();
  }

  function setPlayTime(value: string) {
    const year = value.split("-")[0] ?? "";

    if (year.length > 4) return;

    setListingForm((form) => ({
      ...form,
      playTime: value,
    }));
  }

  function openPicker(nextPicker: "game" | "listingGame" | "platform") {
    setPickerOpen(nextPicker);
    setPickerQuery("");
    setGamePickerPage(1);
  }

  function closePicker() {
    setPickerOpen(null);
    setPickerQuery("");
    setGamePickerPage(1);
  }

  function selectComposerGame(game: Game) {
    setSelectedGameId(String(game.id));
    closePicker();
  }

  function selectListingGame(game: Game) {
    setListingForm((form) => ({
      ...form,
      gameId: String(game.id),
      platform: game.platform ?? form.platform,
    }));
    closePicker();
  }

  function selectListingPlatform(platform: GamePlatform) {
    setListingForm((form) => ({
      ...form,
      platform: platform.name,
    }));
    closePicker();
  }

  function validateMediaFile(file: File, type: ComposerMediaType): string | null {
    if (type === "image" && !file.type.startsWith("image/")) {
      return "Sadece görsel dosyası seçebilirsin.";
    }

    if (type === "video" && !ALLOWED_VIDEO_TYPES.has(file.type)) {
      return "Sadece MP4, WEBM veya OGG video seçebilirsin.";
    }

    if (type === "image" && file.size > MAX_IMAGE_SIZE_BYTES) {
      return `Görsel dosyası çok büyük. En fazla ${MAX_IMAGE_SIZE_MB} MB yükleyebilirsin.`;
    }

    if (type === "video" && file.size > MAX_VIDEO_SIZE_BYTES) {
      return `Video dosyası çok büyük. En fazla ${MAX_VIDEO_SIZE_MB} MB yükleyebilirsin.`;
    }

    return null;
  }

  function setMediaFiles(files: File[], type: ComposerMediaType) {
    const validationError = files
        .map((file) => validateMediaFile(file, type))
        .find((error): error is string => Boolean(error));

    if (validationError) {
      setMediaError(validationError);
      return;
    }

    if (type === "video") {
      setSelectedMedia((currentMedia) => {
        currentMedia.forEach((media) => URL.revokeObjectURL(media.previewUrl));
        return [
          {
            file: files[0],
            previewUrl: URL.createObjectURL(files[0]),
            type,
          },
        ];
      });
      setMediaError(null);
      return;
    }

    setSelectedMedia((currentMedia) => {
      const imageMedia = currentMedia.filter((media) => media.type === "image");
      const availableSlots = MAX_IMAGE_COUNT - imageMedia.length;

      if (availableSlots <= 0) {
        setMediaError(`En fazla ${MAX_IMAGE_COUNT} görsel ekleyebilirsin.`);
        return currentMedia;
      }

      const acceptedFiles = files.slice(0, availableSlots);
      const videoMedia = currentMedia.filter((media) => media.type === "video");
      videoMedia.forEach((media) => URL.revokeObjectURL(media.previewUrl));

      return [
        ...imageMedia,
        ...acceptedFiles.map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
          type,
        })),
      ];
    });
    setMediaError(
        selectedMedia.filter((media) => media.type === "image").length +
        files.length >
        MAX_IMAGE_COUNT
            ? `En fazla ${MAX_IMAGE_COUNT} görsel ekleyebilirsin.`
            : null,
    );
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length) setMediaFiles(files, fileModeRef.current);
    event.target.value = "";
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const imageItem = Array.from(event.clipboardData.items).find((item) =>
        item.type.startsWith("image/"),
    );
    const file = imageItem?.getAsFile();

    if (file) {
      event.preventDefault();
      setMediaFiles([file], "image");
    }
  }

  function clearSelectedMedia() {
    setSelectedMedia((currentMedia) => {
      currentMedia.forEach((media) => URL.revokeObjectURL(media.previewUrl));
      return [];
    });
    setPreviewModalIndex(null);
  }

  function removeSelectedMedia(previewUrl: string) {
    setSelectedMedia((currentMedia) => {
      const filteredMedia = currentMedia.filter((media) => {
        if (media.previewUrl !== previewUrl) return true;

        URL.revokeObjectURL(media.previewUrl);
        return false;
      });

      setPreviewModalIndex((currentIndex) => {
        if (currentIndex === null || filteredMedia.length === 0) return null;
        if (currentIndex >= filteredMedia.length) {
          return filteredMedia.length - 1;
        }
        return currentIndex;
      });

      return filteredMedia;
    });
  }

  function resetComposer() {
    setContent("");
    setMode("post");
    setPollQuestion("");
    setPollOptions(createDefaultPollOptions());
    setPollDurationMinutes(1440);
    setPollOptionEmojiOpenId(null);
    setDraggedPollOptionId(null);
    setSelectedGameId("");
    setSelectedCommunityId("");
    setSelectedVisibility("PUBLIC");
    setListingForm({
      gameId: "",
      title: "",
      description: "",
      platform: "",
      preferredRole: "",
      playerLevel: "",
      microphoneRequired: false,
      playTime: "",
    });
    clearSelectedMedia();
    setEmojiOpen(false);
  }

  function addEmojiToContent(emoji: string) {
    setContent((currentContent) => `${currentContent}${emoji}`);
  }

  function buildPostContent() {
    const trimmedContent = content.trim();

    if (mode === "poll") {
      const options = pollOptions
          .map((option) => option.value.trim())
          .filter(Boolean);
      if (!pollQuestion.trim() || options.length < 2) return "";

      return trimmedContent || pollQuestion.trim();
    }

    if (mode === "game") {
      if (!selectedGame || !trimmedContent) return "";
      return [`Oyun: ${selectedGame.title}`, trimmedContent].join("\n");
    }

    return trimmedContent;
  }

  function addEmojiToPollOption(optionId: string, emoji: string) {
    setPollOptions((currentOptions) =>
        currentOptions.map((currentOption) =>
            currentOption.id === optionId
                ? { ...currentOption, value: `${currentOption.value}${emoji}` }
                : currentOption,
        ),
    );
  }

  function reorderPollOptions(sourceId: string, targetId: string) {
    setPollOptions((currentOptions) => {
      const sourceIndex = currentOptions.findIndex((option) => option.id === sourceId);
      const targetIndex = currentOptions.findIndex((option) => option.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return currentOptions;
      }

      const nextOptions = [...currentOptions];
      const [movedOption] = nextOptions.splice(sourceIndex, 1);
      nextOptions.splice(targetIndex, 0, movedOption);

      return nextOptions;
    });
  }

  function requestSubmit() {
    if (isSubmitting) return;

    if (mode === "listing") {
      void handleSubmit();
      return;
    }

    const postContent = buildPostContent();
    if (!postContent) {
      setMediaError("Paylaşım için gerekli alanları doldur.");
      return;
    }

    setConfirmOpen(true);
  }

  async function handleSubmit() {
    if (isSubmitting) return;

    if (mode === "listing") {
      const gameId = Number(listingForm.gameId);
      if (!gameId || !listingForm.title.trim() || !listingForm.platform.trim()) {
        setMediaError("İlan için oyun, başlık ve platform zorunlu.");
        return;
      }

      await onCreateLookingForPlayer({
        gameId,
        title: listingForm.title.trim(),
        description: listingForm.description.trim() || undefined,
        platform: listingForm.platform.trim(),
        preferredRole: listingForm.preferredRole.trim() || undefined,
        playerLevel: listingForm.playerLevel.trim() || undefined,
        microphoneRequired: listingForm.microphoneRequired,
        playTime: listingForm.playTime || undefined,
      });
      resetComposer();
      return;
    }

    const postContent = buildPostContent();
    if (!postContent) {
      setMediaError("Paylaşım için gerekli alanları doldur.");
      return;
    }

    await onSubmit({
      content: postContent,
      communityId: selectedCommunityId
        ? Number(selectedCommunityId)
        : undefined,
      visibility: selectedVisibility,
      poll:
        mode === "poll"
          ? {
              question: pollQuestion.trim(),
              options: pollOptions
                .map((option) => option.value.trim())
                .filter(Boolean),
              durationMinutes: pollDurationMinutes,
            }
          : undefined,
      mediaFile: selectedMedia[0]?.file,
      mediaFiles: selectedMedia.map((media) => ({
        file: media.file,
        type: media.type,
      })),
      mediaType: selectedMedia[0]?.type,
    });
    resetComposer();
  }

  return (
      <section className="rounded-lg border border-white/10 bg-[#0a101c]/88 p-5 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <UserAvatar
              avatarUrl={user.avatarUrl}
              className="h-12 w-12 border border-white/20"
              name={user.name}
          />

          <div className="flex-1 border-l border-white/10 pl-4">
            {mode !== "listing" && (
                <div className="relative">
                  <div className="mb-3 grid gap-2 sm:grid-cols-2">
                    <select
                        className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-zinc-200 outline-none focus:border-violet-400/60"
                        onChange={(event) => setSelectedCommunityId(event.target.value)}
                        value={selectedCommunityId}
                    >
                      <option value="">Genel akışta paylaş</option>
                      {communities.map((community) => (
                          <option key={community.id} value={community.id}>
                            {community.name} topluluğunda paylaş
                          </option>
                      ))}
                    </select>
                    <select
                        className="h-10 w-full rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm text-zinc-200 outline-none focus:border-violet-400/60"
                        onChange={(event) =>
                          setSelectedVisibility(event.target.value as PostVisibility)
                        }
                        value={selectedVisibility}
                    >
                      {VISIBILITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                      ))}
                    </select>
                  </div>
              <textarea
                  className="min-h-16 w-full resize-none rounded-md border border-transparent bg-transparent px-3 py-2 pr-11 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-500 hover:bg-white/[0.03] focus:border-violet-400/40 focus:bg-white/[0.04]"
                  maxLength={2000}
                  onChange={(event) => {
                    setContent(event.target.value);
                    setEmojiOpen(false);
                  }}
                  onPaste={handlePaste}
                  placeholder={`Ne düşünüyorsun, ${user.name.split(" ")[0]}?`}
                  value={content}
              />
                  <button
                      aria-label="Emoji ekle"
                      className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
                      onClick={() => setEmojiOpen((isOpen) => !isOpen)}
                      type="button"
                  >
                    <Smile size={16} />
                  </button>
                  {emojiOpen && (
                      <EmojiPickerPopover
                          className="absolute right-0 top-11 z-[140] grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40"
                          emojis={DEFAULT_EMOJIS}
                          onClose={() => setEmojiOpen(false)}
                          onSelect={addEmojiToContent}
                      />
                  )}
                </div>
            )}

            <input
                accept={fileAccept}
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
                type="file"
            />

            {mode === "poll" && (
                <div className="mt-3 grid gap-2">
                  <input
                      className="h-10 rounded-lg border border-white/10 bg-slate-950/55 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/60"
                      maxLength={160}
                      onChange={(event) => setPollQuestion(event.target.value)}
                      placeholder="Anket sorusu"
                      value={pollQuestion}
                  />
                  <label className="grid gap-1 text-xs font-semibold text-zinc-400">
                    Anket süresi
                    <select
                        className="h-10 rounded-lg border border-white/10 bg-slate-950/55 px-3 text-sm text-white outline-none focus:border-violet-400/60"
                        onChange={(event) =>
                          setPollDurationMinutes(Number(event.target.value))
                        }
                        value={pollDurationMinutes}
                    >
                      <option value={60}>1 saat</option>
                      <option value={360}>6 saat</option>
                      <option value={1440}>1 gün</option>
                      <option value={4320}>3 gün</option>
                      <option value={10080}>7 gün</option>
                    </select>
                  </label>
                  {pollOptions.map((option, index) => (
                      <div
                          className="relative flex gap-2"
                          key={option.id}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();

                            if (draggedPollOptionId && draggedPollOptionId !== option.id) {
                              reorderPollOptions(draggedPollOptionId, option.id);
                            }

                            setDraggedPollOptionId(null);
                          }}
                      >
                        <button
                            aria-label={`Seçenek ${index + 1} sırasını değiştir`}
                            className="grid h-10 w-10 shrink-0 cursor-grab place-items-center rounded-lg border border-white/10 text-zinc-400 transition hover:bg-white/[0.06] hover:text-white active:cursor-grabbing"
                            draggable
                            onDragEnd={() => setDraggedPollOptionId(null)}
                            onDragStart={() => setDraggedPollOptionId(option.id)}
                            type="button"
                        >
                          <GripVertical size={16} />
                        </button>
                        <input
                            className="h-10 flex-1 rounded-lg border border-white/10 bg-slate-950/55 px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-violet-400/60"
                            maxLength={120}
                            onChange={(event) => {
                              setPollOptions((currentOptions) =>
                                  currentOptions.map((currentOption) =>
                                      currentOption.id === option.id
                                          ? { ...currentOption, value: event.target.value }
                                          : currentOption,
                                  ),
                              );
                            }}
                            placeholder={`Seçenek ${index + 1}`}
                            value={option.value}
                        />
                        <button
                            aria-label="Seçeneğe emoji ekle"
                            className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                            onClick={() =>
                                setPollOptionEmojiOpenId((currentId) =>
                                    currentId === option.id ? null : option.id,
                                )
                            }
                            type="button"
                        >
                          <Smile size={16} />
                        </button>
                        {pollOptionEmojiOpenId === option.id && (
                            <EmojiPickerPopover
                                className="absolute right-12 top-11 z-[140] grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40"
                                emojis={DEFAULT_EMOJIS}
                                onClose={() => setPollOptionEmojiOpenId(null)}
                                onSelect={(emoji) => addEmojiToPollOption(option.id, emoji)}
                            />
                        )}
                        <button
                            aria-label="Seçeneği sil"
                            className="grid h-10 w-10 cursor-pointer place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={pollOptions.length <= 2}
                            onClick={() => {
                              setPollOptions((currentOptions) =>
                                  currentOptions.filter(
                                      (currentOption) => currentOption.id !== option.id,
                                  ),
                              );

                              if (pollOptionEmojiOpenId === option.id) {
                                setPollOptionEmojiOpenId(null);
                              }
                            }}
                            type="button"
                        >
                          <X size={16} />
                        </button>
                      </div>
                  ))}
                  <button
                      className="w-fit cursor-pointer rounded-md px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-white/[0.06]"
                      disabled={pollOptions.length >= 4}
                      onClick={() =>
                          setPollOptions((currentOptions) => [
                            ...currentOptions,
                            createPollOption(),
                          ])
                      }
                      type="button"
                  >
                    {pollOptions.length >= 4
                      ? "En fazla 4 seçenek"
                      : "Seçenek ekle"}
                  </button>
                </div>
            )}

            {mode === "game" && (
                <>
                  <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-100">
                    Oyun paylaşımı metin gönderisi olarak kaydedilir; seçilen oyun başlık
                    satırında gösterilir.
                  </p>
                <button
                    className="mt-3 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/55 px-3 py-2 text-left text-sm text-white outline-none transition hover:border-violet-300/35 hover:bg-white/[0.04]"
                    onClick={() => openPicker("game")}
                    type="button"
                >
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Oyun
                    </span>
                    <span className={selectedGame ? "block truncate font-semibold text-white" : "block text-zinc-500"}>
                      {selectedGame ? selectedGame.title : "Oyun seç"}
                    </span>
                  </span>
                  <Search className="h-4 w-4 shrink-0 text-violet-200" />
                </button>
                </>
            )}

            {mode === "listing" && (
                <div className="mt-1 rounded-lg border border-white/10 bg-slate-950/45 p-4">
                  <div className="mb-4 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <Tag size={17} className="text-violet-200" />
                      Takım ilanı detayları
                    </div>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      Oyuncuların hızlı karar verebilmesi için oyun, platform, rol ve zaman bilgisini net gir.
                    </p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <button
                        className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-left text-sm font-medium text-white outline-none transition hover:border-violet-300/35 hover:bg-white/[0.04]"
                        onClick={() => openPicker("listingGame")}
                        type="button"
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Oyun
                        </span>
                        <span className={selectedListingGame ? "block truncate font-semibold text-white" : "block text-zinc-500"}>
                          {selectedListingGame ? selectedListingGame.title : "Oyun seç"}
                        </span>
                      </span>
                      <Search className="h-4 w-4 shrink-0 text-violet-200" />
                    </button>
                    <button
                        className="flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-left text-sm font-medium text-white outline-none transition hover:border-violet-300/35 hover:bg-white/[0.04]"
                        onClick={() => openPicker("platform")}
                        type="button"
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Platform
                        </span>
                        <span className={listingForm.platform ? "block truncate font-semibold text-white" : "block text-zinc-500"}>
                          {selectedListingPlatform?.name ?? (listingForm.platform || "Platform seç")}
                        </span>
                      </span>
                      <Search className="h-4 w-4 shrink-0 text-violet-200" />
                    </button>
                    <input
                        className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-medium text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400/60 md:col-span-2"
                        maxLength={150}
                        onChange={(event) =>
                            setListingForm((form) => ({
                              ...form,
                              title: event.target.value,
                            }))
                        }
                        placeholder="İlan başlığı"
                        value={listingForm.title}
                    />
                    <input
                        className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-medium text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400/60"
                        maxLength={100}
                        onChange={(event) =>
                            setListingForm((form) => ({
                              ...form,
                              preferredRole: event.target.value,
                            }))
                        }
                        placeholder="Tercih edilen rol"
                        value={listingForm.preferredRole}
                    />
                    <input
                        className="h-11 rounded-lg border border-white/10 bg-slate-950/70 px-3 text-sm font-medium text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400/60"
                        maxLength={50}
                        onChange={(event) =>
                            setListingForm((form) => ({
                              ...form,
                              playerLevel: event.target.value,
                            }))
                        }
                        placeholder="Oyuncu seviyesi"
                        value={listingForm.playerLevel}
                    />
                    <label className="grid min-h-14 gap-1.5 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-violet-300/35 focus-within:border-violet-400/60">
                      <div
                          className="flex cursor-pointer items-center gap-3"
                          onClick={openPlayTimePicker}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              openPlayTimePicker();
                            }
                          }}
                      >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-500/15 text-violet-100">
                    <CalendarClock size={16} />
                  </span>
                        <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-white">
                      Oynama zamanı
                    </span>
                    <input
                        className="ltz-datetime-input mt-0.5 h-5 w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none"
                        max="9999-12-31T23:59"
                        onChange={(event) => setPlayTime(event.target.value)}
                        onClick={(event) => event.stopPropagation()}
                        ref={playTimeInputRef}
                        type="datetime-local"
                        value={listingForm.playTime}
                    />
                  </span>
                      </div>
                    </label>
                    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-zinc-200 transition hover:border-violet-300/35 hover:bg-white/[0.04]">
                <span className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/15 text-violet-100">
                    <Mic size={16} />
                  </span>
                  <span>
                    <span className="block font-semibold text-white">
                      Mikrofon gerekli
                    </span>
                    <span className="block text-xs text-zinc-400">
                      Sesli iletişim şartsa açık bırak.
                    </span>
                  </span>
                </span>
                      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
                  <input
                      checked={listingForm.microphoneRequired}
                      className="peer sr-only"
                      onChange={(event) =>
                          setListingForm((form) => ({
                            ...form,
                            microphoneRequired: event.target.checked,
                          }))
                      }
                      type="checkbox"
                  />
                  <span className="absolute inset-0 rounded-full border border-white/10 bg-white/10 transition peer-checked:border-violet-300/50 peer-checked:bg-violet-500/80" />
                  <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-lg shadow-black/30 transition peer-checked:translate-x-5" />
                </span>
                    </label>
                    <textarea
                        className="min-h-24 resize-none rounded-lg border border-white/10 bg-slate-950/70 px-3 py-2 text-sm leading-6 text-white outline-none transition placeholder:text-zinc-500 focus:border-violet-400/60 md:col-span-2"
                        maxLength={1000}
                        onChange={(event) =>
                            setListingForm((form) => ({
                              ...form,
                              description: event.target.value,
                            }))
                        }
                        placeholder="Açıklama"
                        value={listingForm.description}
                    />
                  </div>
                </div>
            )}

            {selectedMedia.length > 0 && (
                <div
                    className={
                      selectedMedia.length === 1
                          ? "relative mt-3 overflow-hidden rounded-lg border border-white/10"
                          : "mt-3 grid gap-2 sm:grid-cols-3"
                    }
                >
                  {selectedMedia.map((media, index) => (
                      <div
                          className="relative cursor-zoom-in overflow-hidden rounded-lg border border-white/10"
                          key={media.previewUrl}
                          onClick={() => setPreviewModalIndex(index)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setPreviewModalIndex(index);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                      >
                        {media.type === "video" ? (
                            <video
                                className="max-h-48 w-full bg-black object-cover"
                                controls
                                src={media.previewUrl}
                            />
                        ) : (
                            <img
                                alt={`Seçilen gönderi görseli ${index + 1}`}
                                className={
                                  selectedMedia.length === 1
                                      ? "max-h-48 w-full bg-black object-cover"
                                      : "h-24 w-full bg-black object-cover"
                                }
                                src={media.previewUrl}
                            />
                        )}
                        <button
                            aria-label="Medyayı kaldır"
                            className="absolute right-2 top-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-black/70 text-white transition hover:bg-black"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeSelectedMedia(media.previewUrl);
                            }}
                            type="button"
                        >
                          <X size={17} />
                        </button>
                        {selectedMedia.length > 1 && (
                            <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[11px] font-bold text-white">
                      {index + 1}/{selectedMedia.length}
                    </span>
                        )}
                      </div>
                  ))}
                </div>
            )}

            {mediaError && <p className="mt-2 text-xs text-red-300">{mediaError}</p>}
            {uploadProgress !== null && (
                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                        className="h-full rounded-full bg-violet-400 transition-[width]"
                        style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    Medya yükleniyor: %{uploadProgress}
                  </p>
                </div>
            )}
          </div>
        </div>

        {previewMedia &&
            createPortal(
                <div
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
                    onClick={() => setPreviewModalIndex(null)}
                    role="dialog"
                >
                  <div
                      className="relative grid h-[90vh] w-[min(96vw,1100px)] place-items-center overflow-hidden rounded-lg border border-white/10 bg-black"
                      onClick={(event) => event.stopPropagation()}
                  >
                    <button
                        aria-label="Önizlemeyi kapat"
                        className="absolute right-3 top-3 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-black/70 text-white transition hover:bg-white/15"
                        onClick={() => setPreviewModalIndex(null)}
                        type="button"
                    >
                      <X size={18} />
                    </button>

                    {selectedMedia.length > 1 && (
                        <>
                          <button
                              aria-label="Önceki görsel"
                              className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/70 text-white transition hover:bg-white/15"
                              onClick={() => changePreviewMedia(-1)}
                              type="button"
                          >
                            <ChevronLeft size={22} />
                          </button>
                          <button
                              aria-label="Sonraki görsel"
                              className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/70 text-white transition hover:bg-white/15"
                              onClick={() => changePreviewMedia(1)}
                              type="button"
                          >
                            <ChevronRight size={22} />
                          </button>
                          <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
                  {(previewModalIndex ?? 0) + 1}/{selectedMedia.length}
                </span>
                        </>
                    )}

                    {previewMedia.type === "video" ? (
                        <video
                            className="max-h-full max-w-full object-contain"
                            controls
                            src={previewMedia.previewUrl}
                        />
                    ) : (
                        <img
                            alt="Seçilen görsel önizlemesi"
                            className="max-h-full max-w-full object-contain"
                            src={previewMedia.previewUrl}
                        />
                    )}
                  </div>
                </div>,
                document.body,
            )}

        <div className="mt-5 flex flex-col gap-4 border-t border-white/[0.06] pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <ComposerButton
                active={hasSelectedImage}
                icon={<ImageIcon size={17} />}
                label="Görsel"
                onClick={() => chooseFile("image")}
            />
            <ComposerButton
                active={hasSelectedVideo}
                icon={<Video size={17} />}
                label="Video"
                onClick={() => chooseFile("video")}
            />
            <ComposerButton
                active={mode === "poll"}
                icon={<ListFilter size={17} />}
                label="Anket"
                onClick={() => setMode(mode === "poll" ? "post" : "poll")}
            />
            <ComposerButton
                active={mode === "game"}
                icon={<Gamepad2 size={17} />}
                label="Oyun"
                onClick={() => setMode(mode === "game" ? "post" : "game")}
            />
            <ComposerButton
                active={mode === "listing"}
                icon={<Tag size={17} />}
                label="İlan"
                onClick={() => setMode(mode === "listing" ? "post" : "listing")}
            />
          </div>

          <Button
              type="button"
              className="h-11 rounded-lg px-5"
              isLoading={isSubmitting}
              leftIcon={<Plus size={19} />}
              onClick={() => void requestSubmit()}
          >
            {mode === "listing" ? "İlan Ver" : "Paylaş"}
          </Button>
        </div>

        {pickerOpen &&
            createPortal(
                <div
                    aria-modal="true"
                    className="fixed inset-0 z-[115] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
                    onClick={closePicker}
                    role="dialog"
                >
                  <div
                      className="flex max-h-[min(82vh,680px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a101c] shadow-2xl shadow-black/50"
                      onClick={(event) => event.stopPropagation()}
                  >
                    <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                      <div>
                        <h2 className="text-lg font-black text-white">
                          {pickerOpen === "platform" ? "Platform Seç" : "Oyun Seç"}
                        </h2>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Game service verileri içinde arama yap.
                        </p>
                      </div>
                      <button
                          aria-label="Kapat"
                          className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-zinc-400 transition hover:bg-white/5 hover:text-white"
                          onClick={closePicker}
                          type="button"
                      >
                        <X size={18} />
                      </button>
                    </header>

                    <div className="border-b border-white/10 p-4">
                      <div className="flex h-11 items-center gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-zinc-300 focus-within:border-violet-400/60">
                        <Search className="h-4 w-4 text-violet-200" />
                        <input
                            autoFocus
                            className="h-full flex-1 bg-transparent text-sm font-medium text-white outline-none placeholder:text-zinc-500"
                            onChange={(event) => setPickerQuery(event.target.value)}
                            placeholder={
                              pickerOpen === "platform"
                                  ? "Platform ara..."
                                  : "Oyun adı, tür veya platform ara..."
                            }
                            value={pickerQuery}
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                      {pickerOpen === "platform" ? (
                          filteredPlatforms.length ? (
                              <div className="grid gap-2">
                                {filteredPlatforms.map((platform) => (
                                    <button
                                        className="flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-violet-300/35 hover:bg-violet-500/10"
                                        key={platform.id}
                                        onClick={() => selectListingPlatform(platform)}
                                        type="button"
                                    >
                                      <span className="min-w-0">
                                        <span className="block truncate text-sm font-bold text-white">
                                          {platform.name}
                                        </span>
                                        <span className="mt-0.5 block truncate text-xs text-zinc-500">
                                          {[platform.source, platform.status]
                                              .filter(Boolean)
                                              .join(" • ") || "Platform"}
                                        </span>
                                      </span>
                                      <span className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                                        Seç
                                      </span>
                                    </button>
                                ))}
                              </div>
                          ) : (
                              <div className="grid place-items-center py-14 text-sm text-zinc-500">
                                Platform bulunamadı.
                              </div>
                          )
                      ) : filteredGames.length ? (
                          <div className="grid gap-2">
                            {pagedGames.map((game) => (
                                <button
                                    className="flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-violet-300/35 hover:bg-violet-500/10"
                                    key={game.id}
                                    onClick={() =>
                                        pickerOpen === "game"
                                            ? selectComposerGame(game)
                                            : selectListingGame(game)
                                    }
                                    type="button"
                                >
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-bold text-white">
                                      {game.title}
                                    </span>
                                    <span className="mt-0.5 block truncate text-xs text-zinc-500">
                                      {[game.genre, game.platform, game.categoryName]
                                          .filter(Boolean)
                                          .join(" • ") || "Oyun"}
                                    </span>
                                  </span>
                                  <span className="shrink-0 rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                                    Seç
                                  </span>
                                </button>
                            ))}
                          </div>
                      ) : (
                          <div className="grid place-items-center py-14 text-sm text-zinc-500">
                            Oyun bulunamadı.
                          </div>
                      )}
                    </div>

                    {pickerOpen !== "platform" && filteredGames.length > 0 && (
                        <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs font-semibold text-zinc-500">
                            Sayfa {gamePickerPage}/{gamePickerTotalPages} · {filteredGames.length} oyun
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            {gamePickerPageButtons.map((page) => (
                                <button
                                    className={
                                      page === gamePickerPage
                                          ? "grid h-9 min-w-9 cursor-default place-items-center rounded-lg bg-violet-500 px-3 text-sm font-black text-white"
                                          : "grid h-9 min-w-9 cursor-pointer place-items-center rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm font-bold text-zinc-300 transition hover:border-violet-300/35 hover:bg-violet-500/10 hover:text-white"
                                    }
                                    disabled={page === gamePickerPage}
                                    key={page}
                                    onClick={() => setGamePickerPage(page)}
                                    type="button"
                                >
                                  {page === gamePickerTotalPages && page !== 1
                                      ? "Son"
                                      : page}
                                </button>
                            ))}
                          </div>
                        </footer>
                    )}
                  </div>
                </div>,
                document.body,
            )}

        <ConfirmModal
            cancelLabel="Vazgeç"
            confirmLabel="Evet, paylaş"
            message="Bu gönderiyi akışta paylaşmak istediğine emin misin?"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              setConfirmOpen(false);
              void handleSubmit();
            }}
            open={confirmOpen}
            title="Gönderiyi paylaş"
        />
      </section>
  );
}

interface ComposerButtonProps {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function ComposerButton({ active, icon, label, onClick }: ComposerButtonProps) {
  return (
      <button
          className={
            active
                ? "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md bg-violet-600/20 px-3 text-sm text-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-600/30"
                : "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-3 text-sm text-zinc-300 transition hover:-translate-y-0.5 hover:bg-white/[0.05] hover:text-white"
          }
          onClick={onClick}
          type="button"
      >
        {icon}
        {label}
      </button>
  );
}
