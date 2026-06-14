import type { FormEvent } from "react";
import type { GameSystemRequirementRequest } from "../types/gameTypes";

type GameSystemRequirementFormProps = {
  error: string | null;
  loading: boolean;
  onChange: (value: GameSystemRequirementRequest) => void;
  onSubmit: () => void;
  submitLabel: string;
  value: GameSystemRequirementRequest;
};

const requirementFields = [
  { key: "minimumOs", label: "Minimum OS" },
  { key: "minimumCpu", label: "Minimum CPU" },
  { key: "minimumGpu", label: "Minimum GPU" },
  { key: "minimumRam", label: "Minimum RAM" },
  { key: "minimumStorage", label: "Minimum depolama" },
  { key: "recommendedOs", label: "Onerilen OS" },
  { key: "recommendedCpu", label: "Onerilen CPU" },
  { key: "recommendedGpu", label: "Onerilen GPU" },
  { key: "recommendedRam", label: "Onerilen RAM" },
  { key: "recommendedStorage", label: "Onerilen depolama" },
] as const;

const GameSystemRequirementForm = ({
  error,
  loading,
  onChange,
  onSubmit,
  submitLabel,
  value,
}: GameSystemRequirementFormProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const setField = <TKey extends keyof GameSystemRequirementRequest>(
    key: TKey,
    fieldValue: GameSystemRequirementRequest[TKey]
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
        {requirementFields.map((field) => (
          <label className="grid gap-2 text-sm" key={field.key}>
            <span className="text-slate-300">{field.label}</span>
            <input
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              maxLength={field.key.includes("Ram") || field.key.includes("Storage") ? 100 : 150}
              onChange={(event) => setField(field.key, event.target.value)}
              value={value[field.key] ?? ""}
            />
          </label>
        ))}
      </div>

      <label className="grid gap-2 text-sm">
        <span className="text-slate-300">Notlar</span>
        <textarea
          className="min-h-32 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
          maxLength={1000}
          onChange={(event) => setField("notes", event.target.value)}
          value={value.notes ?? ""}
        />
      </label>

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

export default GameSystemRequirementForm;
