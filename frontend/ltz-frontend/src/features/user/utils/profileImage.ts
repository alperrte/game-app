import { API_BASE_URL } from "../../../lib/constants";
import { getAccessToken } from "../../../lib/token";

export const DEFAULT_PROFILE_COVER =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80";

export const PROFILE_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
export const PROFILE_IMAGE_MAX_MB = 5;

export const isImageValid = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.startsWith("http") || lower.startsWith("/api/") || lower.startsWith("data:image");
};

export const getImageUrl = (url: string | null | undefined): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image")) {
    return url;
  }
  const cleanUrl = url.startsWith("/") ? url : `/${url}`;
  const resolved = `${API_BASE_URL}${cleanUrl}`;

  if (cleanUrl.startsWith("/api/social/media/")) {
    const token = getAccessToken();
    if (token) {
      return `${resolved}${resolved.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
    }
  }

  return resolved;
};
