import { useEffect, useState } from "react";

type StudioResource = {
  id: number;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  country: string | null;
};

type StudioResourceRequest = {
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  country?: string | null;
};

type StudioGameResourceManagerProps = {
  createItem: (request: StudioResourceRequest) => Promise<StudioResource>;
  deleteItem: (id: number) => Promise<void>;
  getItems: () => Promise<StudioResource[]>;
  resourceName: string;
  title: string;
  updateItem: (
    id: number,
    request: StudioResourceRequest
  ) => Promise<StudioResource>;
};

const emptyForm: StudioResourceRequest = {
  name: "",
  description: "",
  websiteUrl: "",
  country: "",
};

const emptyToNull = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
};

const normalizeRequest = (
  request: StudioResourceRequest
): StudioResourceRequest => {
  return {
    name: request.name.trim(),
    description: emptyToNull(request.description),
    websiteUrl: emptyToNull(request.websiteUrl),
    country: emptyToNull(request.country),
  };
};

const StudioGameResourceManager = ({
  createItem,
  deleteItem,
  getItems,
  resourceName,
  title,
  updateItem,
}: StudioGameResourceManagerProps) => {
  const [items, setItems] = useState<StudioResource[]>([]);
  const [formValue, setFormValue] = useState<StudioResourceRequest>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextItems = await getItems();
        setItems(nextItems);
      } catch {
        setError(`${resourceName} listesi yüklenirken bir hata oluştu.`);
      } finally {
        setLoading(false);
      }
    };

    void loadItems();
  }, [getItems, resourceName]);

  const resetForm = () => {
    setFormValue(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    const request = normalizeRequest(formValue);

    if (!request.name) {
      setError(`${resourceName} adı zorunludur.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        const updatedItem = await updateItem(editingId, request);
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === updatedItem.id ? updatedItem : item
          )
        );
      } else {
        const createdItem = await createItem(request);
        setItems((currentItems) => [createdItem, ...currentItems]);
      }

      resetForm();
    } catch {
      setError(`${resourceName} kaydedilirken bir hata oluştu.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: StudioResource) => {
    setEditingId(item.id);
    setFormValue({
      name: item.name,
      description: item.description ?? "",
      websiteUrl: item.websiteUrl ?? "",
      country: item.country ?? "",
    });
  };

  const handleDelete = async (item: StudioResource) => {
    const confirmed = window.confirm(`${item.name} kaydını silmek istiyor musun?`);

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await deleteItem(item.id);
      setItems((currentItems) =>
        currentItems.filter((currentItem) => currentItem.id !== item.id)
      );

      if (editingId === item.id) {
        resetForm();
      }
    } catch {
      setError(`${resourceName} silinirken bir hata oluştu.`);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-cyan-300">
          Oyun Servisi
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {resourceName} kayıtlarını oyun servisi üzerinden yönet.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form
        className="grid gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Ad *</span>
            <input
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              maxLength={150}
              onChange={(event) =>
                setFormValue({ ...formValue, name: event.target.value })
              }
              required
              value={formValue.name}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Ülke</span>
            <input
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              maxLength={100}
              onChange={(event) =>
                setFormValue({ ...formValue, country: event.target.value })
              }
              value={formValue.country ?? ""}
            />
          </label>

          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="text-slate-300">Web Sitesi URL</span>
            <input
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              maxLength={500}
              onChange={(event) =>
                setFormValue({ ...formValue, websiteUrl: event.target.value })
              }
              value={formValue.websiteUrl ?? ""}
            />
          </label>

          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="text-slate-300">Açıklama</span>
            <textarea
              className="min-h-28 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              maxLength={1000}
              onChange={(event) =>
                setFormValue({
                  ...formValue,
                  description: event.target.value,
                })
              }
              value={formValue.description ?? ""}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting
              ? "Kaydediliyor..."
              : editingId
                ? "Güncelle"
                : "Oluştur"}
          </button>
          {editingId ? (
            <button
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200"
              onClick={resetForm}
              type="button"
            >
              Vazgeç
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-sm text-slate-300">
          Liste yükleniyor...
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-sm text-slate-300">
          Henüz kayıt yok.
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="grid gap-3">
          {items.map((item) => (
            <article
              className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-800 bg-slate-950 p-4"
              key={item.id}
            >
              <div>
                <h2 className="font-medium text-white">{item.name}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {item.description ?? "Açıklama yok."}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {item.country ?? "Ülke yok"} · {item.websiteUrl ?? "Web sitesi yok"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200"
                  onClick={() => handleEdit(item)}
                  type="button"
                >
                  Düzenle
                </button>
                <button
                  className="rounded-md border border-red-800 px-3 py-2 text-sm text-red-200"
                  onClick={() => void handleDelete(item)}
                  type="button"
                >
                  Sil
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};

export default StudioGameResourceManager;
