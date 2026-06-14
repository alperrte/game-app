import { useEffect, useState } from "react";

type SimpleResource = {
  id: number;
  name: string;
  description: string | null;
};

type SimpleResourceRequest = {
  name: string;
  description?: string | null;
};

type SimpleGameResourceManagerProps = {
  createItem: (request: SimpleResourceRequest) => Promise<SimpleResource>;
  deleteItem: (id: number) => Promise<void>;
  getItems: () => Promise<SimpleResource[]>;
  resourceName: string;
  title: string;
  updateItem: (
    id: number,
    request: SimpleResourceRequest
  ) => Promise<SimpleResource>;
};

const emptyForm: SimpleResourceRequest = {
  name: "",
  description: "",
};

const normalizeRequest = (
  request: SimpleResourceRequest
): SimpleResourceRequest => {
  const description = request.description?.trim();

  return {
    name: request.name.trim(),
    description: description ? description : null,
  };
};

const SimpleGameResourceManager = ({
  createItem,
  deleteItem,
  getItems,
  resourceName,
  title,
  updateItem,
}: SimpleGameResourceManagerProps) => {
  const [items, setItems] = useState<SimpleResource[]>([]);
  const [formValue, setFormValue] = useState<SimpleResourceRequest>(emptyForm);
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
        setError(`${resourceName} listesi yuklenirken bir hata olustu.`);
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
      setError(`${resourceName} adi zorunludur.`);
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
      setError(`${resourceName} kaydedilirken bir hata olustu.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item: SimpleResource) => {
    setEditingId(item.id);
    setFormValue({
      name: item.name,
      description: item.description ?? "",
    });
  };

  const handleDelete = async (item: SimpleResource) => {
    const confirmed = window.confirm(`${item.name} kaydini silmek istiyor musun?`);

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
      setError(`${resourceName} silinirken bir hata olustu.`);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-cyan-300">
          Game Service
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {resourceName} kayitlarini game-service uzerinden yonet.
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
              maxLength={100}
              onChange={(event) =>
                setFormValue({ ...formValue, name: event.target.value })
              }
              required
              value={formValue.name}
            />
          </label>

          <label className="grid gap-2 text-sm">
            <span className="text-slate-300">Aciklama</span>
            <input
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              maxLength={500}
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
                ? "Guncelle"
                : "Olustur"}
          </button>
          {editingId ? (
            <button
              className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200"
              onClick={resetForm}
              type="button"
            >
              Vazgec
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-sm text-slate-300">
          Liste yukleniyor...
        </div>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-950 p-6 text-sm text-slate-300">
          Henuz kayit yok.
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
                  {item.description ?? "Aciklama yok."}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200"
                  onClick={() => handleEdit(item)}
                  type="button"
                >
                  Duzenle
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

export default SimpleGameResourceManager;
