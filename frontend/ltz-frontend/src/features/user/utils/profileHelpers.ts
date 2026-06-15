export const getYouTubeVideoId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/;
  const match = url.match(regExp);
  if (match?.[1]) return match[1];
  if (url.trim().length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
    return url.trim();
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
