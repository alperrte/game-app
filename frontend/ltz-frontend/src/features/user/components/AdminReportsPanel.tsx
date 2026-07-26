import { useEffect, useState } from "react";
import { AlertOctagon, Check, Loader2, Trash2 } from "lucide-react";

import { useToast } from "../../../components/ui/toastContext";
import { userService } from "../services/userService";
import type { UserProfileReviewResponse } from "../types/user";

export function AdminReportsPanel() {
  const { showToast } = useToast();
  const [reports, setReports] = useState<UserProfileReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    userService.getReportedReviews()
      .then((data) => {
        if (active) {
          setReports(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          showToast("Şikayetler yüklenirken bir hata oluştu.", "error");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  const handleResolve = async (id: number) => {
    setBusyId(id);
    try {
      await userService.resolveReportedReview(id);
      showToast("Şikayet temizlendi.", "success");
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showToast("Şikayet çözülürken hata oluştu.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu yorumu tamamen silmek istediğinize emin misiniz?")) return;
    setBusyId(id);
    try {
      await userService.deleteUserCommendation(id);
      showToast("Yorum silindi.", "success");
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch {
      showToast("Yorum silinirken hata oluştu.", "error");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="profile-display-font text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-rose-500" />
          Yorum Şikayetleri
        </h2>
        <p className="text-sm text-zinc-500">Oyuncu profillerinde şikayet edilen yorumları inceleyin ve yönetin.</p>
      </div>

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
          Aktif veya bekleyen yorum şikayeti bulunmamaktadır.
        </div>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
          {reports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-rose-500/20 bg-slate-950/40 p-4 transition hover:bg-slate-950/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-zinc-400">Yazan:</span>
                    <a
                      href={`/profile/${report.reviewerUsername}`}
                      className="text-xs font-black text-white hover:underline hover:text-violet-400"
                    >
                      @{report.reviewerUsername}
                    </a>
                    <span className="text-xs text-zinc-600">|</span>
                    <span className="text-xs font-bold text-zinc-400">Profil sahibi ID:</span>
                    <span className="text-xs text-zinc-300 font-bold">{report.reviewedId}</span>
                  </div>
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 text-[11px] font-black text-rose-300 inline-block uppercase">
                    Şikayet Nedeni: {report.reportReason || "Belirtilmedi"}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    disabled={busyId !== null}
                    onClick={() => void handleResolve(report.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-xl bg-emerald-500/20 px-3 text-xs font-bold text-emerald-300 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                    title="Şikayeti Kaldır (Onayla)"
                  >
                    {busyId === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" /> Onayla
                      </>
                    )}
                  </button>
                  <button
                    disabled={busyId !== null}
                    onClick={() => void handleDelete(report.id)}
                    className="inline-flex h-8 items-center gap-1 rounded-xl bg-rose-500/20 px-3 text-xs font-bold text-rose-300 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                    title="Yorumu Tamamen Sil"
                  >
                    {busyId === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" /> Sil
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-zinc-950/80 p-3 border border-zinc-900">
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed break-all">
                  {report.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
