import { getImageUrl, isImageValid } from "../utils/profileImage";

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export function UserAvatar({
  name,
  avatarUrl,
  className = "h-12 w-12",
  imageClassName,
  fallbackClassName,
}: UserAvatarProps) {
  const resolvedUrl =
    avatarUrl && isImageValid(avatarUrl) ? getImageUrl(avatarUrl) : null;

  if (resolvedUrl) {
    return (
      <img
        alt={name}
        className={
          imageClassName ??
          `${className} rounded-full border border-white/20 object-cover`
        }
        src={resolvedUrl}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={
        fallbackClassName ??
        `grid place-items-center rounded-full border border-white/20 bg-violet-700 text-sm font-bold text-white ${className}`
      }
    >
      {(name || "?").slice(0, 1).toUpperCase()}
    </div>
  );
}
