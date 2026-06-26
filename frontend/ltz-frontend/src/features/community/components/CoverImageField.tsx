import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { socialService } from "../../social/services/socialService";
import { getImageUrl } from "../../user/utils/profileImage";
import { getErrorMessage } from "../../../utils/getErrorMessage";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type CoverImageFieldProps = {
  value?: string;
  onChange: (url: string) => void;
  accent?: "violet" | "fuchsia";
};

export function CoverImageField({
  value = "",
  onChange,
  accent = "violet",
}: CoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("JPG, PNG, WEBP veya GIF formatında bir görsel seçmelisin.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Kapak görseli en fazla 10 MB olabilir.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current.startsWith("blob:")) URL.revokeObjectURL(current);
      return localPreview;
    });
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const uploaded = await socialService.uploadImage(file, (uploadEvent) => {
        if (!uploadEvent.total) return;
        setProgress(Math.round((uploadEvent.loaded / uploadEvent.total) * 100));
      });
      onChange(uploaded.imageUrl);
      setProgress(100);
    } catch (uploadError) {
      onChange("");
      setError(getErrorMessage(uploadError, "Görsel yüklenemedi."));
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    onChange("");
    setPreviewUrl("");
    setProgress(0);
    setError(null);
  }

  const resolvedPreview = value
    ? previewUrl || getImageUrl(value)
    : "";
  const buttonColor =
    accent === "fuchsia"
      ? "border-fuchsia-500/40 text-fuchsia-200 hover:bg-fuchsia-500/10"
      : "border-violet-500/40 text-violet-200 hover:bg-violet-500/10";

  return (
    <div className="space-y-3 md:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white"
          maxLength={500}
          placeholder="Kapak görseli URL (opsiyonel)"
          value={value}
          onChange={(event) => {
            setPreviewUrl("");
            onChange(event.target.value);
          }}
        />
        <input
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
          ref={inputRef}
          type="file"
        />
        <button
          className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-bold ${buttonColor}`}
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {uploading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {uploading ? `%${progress}` : "Dosyadan seç"}
        </button>
      </div>

      {resolvedPreview ? (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800">
          <img
            alt="Kapak görseli önizlemesi"
            className="h-48 w-full object-cover"
            src={resolvedPreview}
          />
          <button
            aria-label="Kapak görselini kaldır"
            className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white hover:bg-black"
            onClick={clearImage}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
