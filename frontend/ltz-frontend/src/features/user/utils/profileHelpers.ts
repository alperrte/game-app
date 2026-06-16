export const getYouTubeVideoId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([^#&?]{11})/,
    /music\.youtube\.com\/watch\?v=([^#&?]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }

  if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
};

export const getGamerTypeLabel = (type: string | null) => {
  switch (type) {
    case "CASUAL":
      return "Casual Gamer";
    case "COMPETITIVE":
      return "Competitive Gamer";
    case "PRO":
      return "Pro E-Sports Player";
    case "SPEEDRUNNER":
      return "Speedrunner";
    case "ACHIEVEMENT_HUNTER":
      return "Achievement Hunter";
    case "STORY_LOVER":
      return "Story Lover";
    default:
      return "Gamer";
  }
};

export const formatProfileDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
};

export const isPioneerAccount = (createdAt: string, nowMs: number): boolean => {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return nowMs - created > 7 * 24 * 60 * 60 * 1000;
};
