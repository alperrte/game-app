import { useEffect, useRef } from "react";

export const DEFAULT_EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🔥",
  "🎮",
  "🏆",
  "👏",
  "😎",
  "😭",
  "😡",
  "❤️",
  "✨",
];

interface EmojiPickerPopoverProps {
  emojis?: string[];
  onSelect: (emoji: string) => void;
  onClose: () => void;
  className?: string;
}

export function EmojiPickerPopover({
  emojis = DEFAULT_EMOJIS,
  onSelect,
  onClose,
  className = "absolute right-0 top-12 z-30 grid w-56 grid-cols-6 gap-1 rounded-lg border border-white/10 bg-[#0b1220] p-2 shadow-2xl shadow-black/40",
}: EmojiPickerPopoverProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [onClose]);

  return (
    <div className={className} ref={containerRef}>
      {emojis.map((emoji) => (
        <button
          aria-label={`Emoji ${emoji}`}
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-md text-lg transition hover:bg-white/[0.08]"
          key={emoji}
          onClick={() => onSelect(emoji)}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
