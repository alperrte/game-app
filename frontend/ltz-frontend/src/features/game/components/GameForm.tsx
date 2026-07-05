import type { FormEvent } from "react";
import type { GameRequest } from "../types/gameTypes";

type GameFormProps = {
  error: string | null;
  loading: boolean;
  onChange: (value: GameRequest) => void;
  onSubmit: () => void;
  submitLabel: string;
  value: GameRequest;
};

const booleanFields = [
  {
    key: "earlyAccess",
    label: "Erken Erişim",
  },
  {
    key: "onSale",
    label: "İndirimde",
  },
  {
    key: "turkishLanguageSupport",
    label: "Türkçe dil desteği",
  },
] as const;

const GameForm = ({
  error,
  loading,
  onChange,
  onSubmit,
  submitLabel,
  value,
}: GameFormProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const setField = <TKey extends keyof GameRequest>(
    key: TKey,
    fieldValue: GameRequest[TKey]
  ) => {
    onChange({ ...value, [key]: fieldValue });
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Oyun adı *</span>
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            maxLength={150}
            onChange={(event) => setField("title", event.target.value)}
            required
            value={value.title}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Kapak görseli URL</span>
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            maxLength={500}
            onChange={(event) =>
              setField("coverImageUrl", event.target.value)
            }
            value={value.coverImageUrl ?? ""}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Tür</span>
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            maxLength={100}
            onChange={(event) => setField("genre", event.target.value)}
            value={value.genre ?? ""}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Platform</span>
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            maxLength={100}
            onChange={(event) => setField("platform", event.target.value)}
            value={value.platform ?? ""}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Çıkış tarihi</span>
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            onChange={(event) => setField("releaseDate", event.target.value)}
            type="date"
            value={value.releaseDate ?? ""}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Popülerlik skoru</span>
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            min={0}
            onChange={(event) =>
              setField("popularityScore", Number(event.target.value))
            }
            type="number"
            value={value.popularityScore ?? 0}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">Geliştirici</span>
          <input
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            maxLength={150}
            onChange={(event) => setField("developer", event.target.value)}
            value={value.developer ?? ""}
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="text-slate-300">Açıklama</span>
        <textarea
          className="min-h-32 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          maxLength={3000}
          onChange={(event) => setField("description", event.target.value)}
          value={value.description ?? ""}
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">
            Minimum sistem gereksinimleri
          </span>
          <textarea
            className="min-h-28 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            maxLength={2000}
            onChange={(event) =>
              setField("minimumSystemRequirements", event.target.value)
            }
            value={value.minimumSystemRequirements ?? ""}
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="text-slate-300">
            Önerilen sistem gereksinimleri
          </span>
          <textarea
            className="min-h-28 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            maxLength={2000}
            onChange={(event) =>
              setField("recommendedSystemRequirements", event.target.value)
            }
            value={value.recommendedSystemRequirements ?? ""}
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="text-slate-300">Desteklenen diller</span>
        <input
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          maxLength={500}
          onChange={(event) =>
            setField("supportedLanguages", event.target.value)
          }
          value={value.supportedLanguages ?? ""}
        />
      </label>

      <div className="flex flex-wrap gap-4 text-sm text-slate-300">
        {booleanFields.map((field) => (
          <label className="flex items-center gap-2" key={field.key}>
            <input
              checked={value[field.key] === true}
              onChange={(event) => setField(field.key, event.target.checked)}
              type="checkbox"
            />
            {field.label}
          </label>
        ))}
      </div>

      <button
        className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Kaydediliyor..." : submitLabel}
      </button>
    </form>
  );
};

export default GameForm;
