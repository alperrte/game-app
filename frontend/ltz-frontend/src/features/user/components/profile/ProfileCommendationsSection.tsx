import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Users2, 
  Award, 
  Crosshair, 
  Brain, 
  Heart, 
  Trash2, 
  Send,
  MessageSquare,
  AlertOctagon,
  Flag,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuthStore } from "../../../../store/authStore";

import { userService } from "../../services/userService";
import type { 
  UserProfileReviewResponse, 
  UserProfileCommendationsSummary,
  CreateProfileReviewRequest
} from "../../types/user";
import { SectionPanel } from "./ProfilePrimitives";
import { formatProfileDate } from "../../utils/profileHelpers";
import { isImageValid, getImageUrl } from "../../utils/profileImage";

type ProfileCommendationsSectionProps = {
  profileUserId: string;
  isOwnProfile: boolean;
  currentUserId?: string;
  theme?: {
    glow?: string;
    border?: string;
    text?: string;
  };
};

export function ProfileCommendationsSection({ 
  profileUserId, 
  isOwnProfile, 
  currentUserId,
  theme
}: ProfileCommendationsSectionProps) {
  const [reviews, setReviews] = useState<UserProfileReviewResponse[]>([]);
  const [summary, setSummary] = useState<UserProfileCommendationsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Authentication & Auth Roles
  const { user: authUser } = useAuthStore();
  // TODO: Gelecekte moderatörlerin de şikayetleri inline olarak yönetebilmesi için "|| authUser?.role === 'MODERATOR'" veya "|| authUser?.role === 'ROLE_MODERATOR'" eklenebilir.
  const isAdmin = authUser?.role === "ADMIN" || authUser?.role === "ROLE_ADMIN";

  // Reporting State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingReviewId, setReportingReviewId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportFormError, setReportFormError] = useState<string | null>(null);

  // Blurlanan yorumları lokalde geçici gösterme durumu
  const [revealedReviews, setRevealedReviews] = useState<Record<number, boolean>>({});

  // Form State
  const [content, setContent] = useState("");
  const [friendly, setFriendly] = useState(false);
  const [leader, setLeader] = useState(false);
  const [aimGod, setAimGod] = useState(false);
  const [tactician, setTactician] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);


  const hasReviewed = reviews.some(r => r.reviewerId === currentUserId);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const [reviewsData, summaryData] = await Promise.all([
          userService.getUserCommendations(profileUserId),
          userService.getCommendationsSummary(profileUserId)
        ]);
        if (active) {
          setReviews(reviewsData);
          setSummary(summaryData);
          setError(null);
        }
      } catch (err) {
        console.error("Takdir bilgileri yüklenirken hata oluştu:", err);
        if (active) {
          setError("Takdir ve yorum verileri yüklenemedi.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    void loadData();
    return () => {
      active = false;
    };
  }, [profileUserId, refreshTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    if (!content.trim()) {
      setFormError("Lütfen bir yorum yazın.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const request: CreateProfileReviewRequest = {
      content: content.trim(),
      friendlyPoint: friendly,
      leaderPoint: leader,
      aimGodPoint: aimGod,
      tacticianPoint: tactician
    };

    try {
      await userService.createUserCommendation(profileUserId, request);
      setContent("");
      setFriendly(false);
      setLeader(false);
      setAimGod(false);
      setTactician(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      const apiError = err as { response?: { data?: { message?: string } } };
      setFormError(apiError.response?.data?.message || "Takdir gönderilirken hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    try {
      await userService.deleteUserCommendation(reviewId);
      setRefreshTrigger(prev => prev + 1);
    } catch {
      alert("Yorum silinirken bir hata oluştu.");
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingReviewId || !reportReason) return;

    setReporting(true);
    setReportFormError(null);

    try {
      await userService.reportUserProfileReview(reportingReviewId, reportReason);
      setReportModalOpen(false);
      setReportReason("");
      setReportingReviewId(null);
      setRefreshTrigger(prev => prev + 1);
      alert("Yorum şikayeti başarıyla iletildi. İnceleme başlatılacaktır.");
    } catch (err) {
      console.error("Raporlama sırasında hata oluştu:", err);
      setReportFormError("Şikayet iletilirken bir hata oluştu.");
    } finally {
      setReporting(false);
    }
  };

  const handleResolve = async (reviewId: number) => {
    if (!confirm("Bu yorumun şikayetini temizlemek ve onaylamak istediğinize emin misiniz?")) return;
    try {
      await userService.resolveReportedReview(reviewId);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Şikayet çözülürken hata oluştu:", err);
      alert("İşlem gerçekleştirilemedi.");
    }
  };


  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0a101c]/80 px-6 py-12 text-center text-zinc-400">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        <p className="mt-4 text-sm font-semibold">Takdir verileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-8 text-center text-rose-300">
        <p className="text-sm font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <SectionPanel
      description="Diğer lobi üyelerinin bu oyuncu hakkındaki değerlendirmeleri ve takdir puanları."
      id="profile-commendations"
      title="Oyuncu Takdirleri & Yorumları (+Rep)"
      className={theme?.border}
    >
      {/* 1. Commendation Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Friendly Card */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/10 bg-emerald-950/10 p-5 text-center shadow-lg transition hover:border-emerald-500/20">
          <Heart className="mx-auto h-7 w-7 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
          <p className="mt-3 text-2xl font-black text-white">{summary?.friendlyCount || 0}</p>
          <p className="mt-1 text-xs font-bold text-emerald-400 uppercase tracking-wider">🤝 Uyumlu</p>
        </div>

        {/* Leader Card */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/10 bg-amber-950/10 p-5 text-center shadow-lg transition hover:border-amber-500/20">
          <Award className="mx-auto h-7 w-7 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
          <p className="mt-3 text-2xl font-black text-white">{summary?.leaderCount || 0}</p>
          <p className="mt-1 text-xs font-bold text-amber-400 uppercase tracking-wider">📣 Lider</p>
        </div>

        {/* Aim God Card */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-500/10 bg-rose-950/10 p-5 text-center shadow-lg transition hover:border-rose-500/20">
          <Crosshair className="mx-auto h-7 w-7 text-rose-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]" />
          <p className="mt-3 text-2xl font-black text-white">{summary?.aimGodCount || 0}</p>
          <p className="mt-1 text-xs font-bold text-rose-400 uppercase tracking-wider">🎯 Aim God</p>
        </div>

        {/* Tactician Card */}
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/10 bg-cyan-950/10 p-5 text-center shadow-lg transition hover:border-cyan-500/20">
          <Brain className="mx-auto h-7 w-7 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" />
          <p className="mt-3 text-2xl font-black text-white">{summary?.tacticianCount || 0}</p>
          <p className="mt-1 text-xs font-bold text-cyan-400 uppercase tracking-wider">🧠 Taktisyen</p>
        </div>
      </div>

      <div className="mt-8 border-t border-white/5 pt-8">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          
          {/* 2. Reviews Timeline */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-base font-bold text-white uppercase tracking-wider">
              <MessageSquare className="h-5 w-5 text-violet-400 animate-pulse" />
              Yorumlar ({reviews.length})
            </h3>
            
            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-12 text-center text-zinc-500">
                <Users2 className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm font-semibold">Henüz bir yorum bırakılmamış. İlk yorumu sen yaz!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => {
                  const isReviewer = review.reviewerId === currentUserId;
                  const isProfileOwner = isOwnProfile;
                  const canDelete = isReviewer || isProfileOwner;
                  const isReported = !!review.reported;
                  const isRevealed = !!revealedReviews[review.id];

                  if (isReported && !isAdmin && !isRevealed) {
                    return (
                      <div 
                        key={review.id}
                        className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-950/5 p-5 text-center transition hover:border-rose-500/30"
                      >
                        <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-[6px] pointer-events-none" />
                        <div className="relative flex flex-col items-center justify-center py-2">
                          <AlertOctagon className="h-6 w-6 text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse" />
                          <p className="mt-2 text-xs font-black tracking-wide text-rose-300 uppercase">
                            Yorum Şikayet Edildi
                          </p>
                          <p className="mt-1 text-xs text-zinc-400 max-w-md">
                            Bu yorum topluluk kurallarını ihlal ettiği gerekçesiyle şikayet edilmiş olup inceleme altındadır.
                          </p>
                          <button
                            onClick={() => setRevealedReviews(prev => ({ ...prev, [review.id]: true }))}
                            className="mt-3 flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" /> İçeriği Göster (Yine de Oku)
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={review.id}
                      className={`group relative rounded-2xl border p-5 transition hover:bg-slate-950/60 ${
                        isReported 
                          ? "border-rose-500/30 bg-rose-950/5 hover:border-rose-500/40" 
                          : "border-white/5 bg-slate-950/40 hover:border-white/10"
                      }`}
                    >
                      {/* Reported Status Notice for Admins / Toggled Viewers */}
                      {isReported && (
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-300">
                          <div className="flex items-center gap-1.5">
                            <AlertOctagon className="h-4 w-4 shrink-0 text-rose-400" />
                            <span>
                              {isAdmin 
                                ? `ŞİKAYET EDİLDİ: "${review.reportReason || "Belirtilmedi"}"` 
                                : "Bu yorum topluluk kuralları ihlali nedeniyle şikayet edilmiştir."}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAdmin && (
                              <button
                                onClick={() => void handleResolve(review.id)}
                                className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-400 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                              >
                                Şikayeti Kaldır
                              </button>
                            )}
                            {isRevealed && !isAdmin && (
                              <button
                                onClick={() => setRevealedReviews(prev => ({ ...prev, [review.id]: false }))}
                                className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer"
                              >
                                <EyeOff className="h-3 w-3" /> Gizle
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Reviewer Header */}
                      <div className="flex items-start justify-between gap-3">
                        <Link 
                          to={`/profile/${review.reviewerUsername}`}
                          className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer"
                        >
                          <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                            {isImageValid(review.reviewerAvatarUrl) ? (
                              <img 
                                src={getImageUrl(review.reviewerAvatarUrl)} 
                                alt={review.reviewerUsername} 
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-zinc-400">
                                {review.reviewerDisplayName?.charAt(0) || review.reviewerUsername.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-extrabold text-white">
                                {review.reviewerDisplayName || review.reviewerUsername}
                              </span>
                              <span className="text-xs text-zinc-500 font-semibold">
                                @{review.reviewerUsername}
                              </span>
                            </div>
                            <span className="text-xs text-zinc-500">
                              {formatProfileDate(review.createdAt)}
                            </span>
                          </div>
                        </Link>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-150">
                          {/* Report Button (if not own review) */}
                          {!isReviewer && currentUserId && !isReported && (
                            <button
                              onClick={() => {
                                setReportingReviewId(review.id);
                                setReportModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Şikayet Et"
                            >
                              <Flag className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Button */}
                          {canDelete && (
                            <button
                              onClick={() => void handleDelete(review.id)}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                              title="Yorumu Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>


                      {/* Commendation Tags Substituted inside comment */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {review.friendlyPoint && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black text-emerald-300 uppercase">
                            <Heart className="h-3 w-3" /> Uyumlu
                          </span>
                        )}
                        {review.leaderPoint && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-black text-amber-300 uppercase">
                            <Award className="h-3 w-3" /> Lider
                          </span>
                        )}
                        {review.aimGodPoint && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-0.5 text-[10px] font-black text-rose-300 uppercase">
                            <Crosshair className="h-3 w-3" /> Aim God
                          </span>
                        )}
                        {review.tacticianPoint && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-black text-cyan-300 uppercase">
                            <Brain className="h-3 w-3" /> Taktisyen
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <p className="mt-3 text-sm text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
                        {review.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Review Submit Form */}
          <div>
            {!currentUserId ? (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
                <AlertOctagon className="mx-auto h-8 w-8 text-yellow-400" />
                <p className="mt-3 text-sm font-semibold text-yellow-200">
                  Değerlendirme bırakmak için giriş yapmalısınız.
                </p>
              </div>
            ) : isOwnProfile ? (
              <div className="rounded-2xl border border-white/5 bg-slate-900/20 p-5 text-center">
                <p className="text-sm font-semibold text-zinc-500">
                  Kendi profilinizi takdir edemez veya değerlendiremezsiniz.
                </p>
              </div>
            ) : hasReviewed ? (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5 text-center">
                <p className="text-sm font-semibold text-violet-300">
                  Bu oyuncuyu zaten değerlendirdiniz.
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Yeni bir değerlendirme bırakmak için soldaki yorumunuzu silebilirsiniz.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/5 bg-slate-950/60 p-5">
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Takdir Gönder
                </h4>

                {formError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 font-bold">
                    {formError}
                  </div>
                )}

                {/* Commendation Checklist */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    Takdir Rozetleri Seç (Opsiyonel)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Friendly Toggle */}
                    <button
                      type="button"
                      onClick={() => setFriendly(!friendly)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition cursor-pointer ${
                        friendly 
                          ? "border-emerald-500/50 bg-emerald-950/20 text-emerald-300" 
                          : "border-white/5 bg-slate-900/40 text-zinc-400 hover:bg-slate-900/60"
                      }`}
                    >
                      <Heart className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">🤝 Uyumlu</span>
                    </button>

                    {/* Leader Toggle */}
                    <button
                      type="button"
                      onClick={() => setLeader(!leader)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition cursor-pointer ${
                        leader 
                          ? "border-amber-500/50 bg-amber-950/20 text-amber-300" 
                          : "border-white/5 bg-slate-900/40 text-zinc-400 hover:bg-slate-900/60"
                      }`}
                    >
                      <Award className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">📣 Lider</span>
                    </button>

                    {/* Aim God Toggle */}
                    <button
                      type="button"
                      onClick={() => setAimGod(!aimGod)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition cursor-pointer ${
                        aimGod 
                          ? "border-rose-500/50 bg-rose-950/20 text-rose-300" 
                          : "border-white/5 bg-slate-900/40 text-zinc-400 hover:bg-slate-900/60"
                      }`}
                    >
                      <Crosshair className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">🎯 Aim God</span>
                    </button>

                    {/* Tactician Toggle */}
                    <button
                      type="button"
                      onClick={() => setTactician(!tactician)}
                      className={`flex items-center gap-2 rounded-xl border p-3 text-left transition cursor-pointer ${
                        tactician 
                          ? "border-cyan-500/50 bg-cyan-950/20 text-cyan-300" 
                          : "border-white/5 bg-slate-900/40 text-zinc-400 hover:bg-slate-900/60"
                      }`}
                    >
                      <Brain className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider">🧠 Taktisyen</span>
                    </button>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
                    Değerlendirme Mesajı
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Oyuncu hakkında bir şeyler yaz (+rep friendly player)..."
                    maxLength={1000}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/90 p-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-violet-500"
                  />
                  <div className="text-right text-[10px] text-zinc-500 font-bold">
                    {content.length}/1000
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 py-3.5 text-sm font-black text-white transition duration-150 cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Gönderiliyor..." : "Değerlendirmeyi Yayınla"}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setReportModalOpen(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/35 bg-[#0e1626] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-white uppercase tracking-wider">
              <AlertOctagon className="h-5 w-5 text-rose-500" />
              Yorum Rapor Et
            </h3>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Lütfen topluluk kurallarımızı (küfür, nefret söylemi, spam, taciz) ihlal eden bu yorum için şikayet nedenini belirtin.
            </p>

            {reportFormError && (
              <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300 font-bold">
                {reportFormError}
              </div>
            )}

            <form onSubmit={handleReport} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide mb-1.5">
                  Şikayet Nedeni
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  className="w-full rounded-xl border border-white/10 bg-slate-950/95 p-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-rose-500 cursor-pointer"
                >
                  <option value="" disabled className="bg-slate-950">Seçiniz...</option>
                  <option value="Küfür / Hakaret" className="bg-slate-950">Küfür / Hakaret</option>
                  <option value="Spam / Yanıltıcı İçerik" className="bg-slate-950">Spam / Yanıltıcı İçerik</option>
                  <option value="Nefret Söylemi / Ayrımcılık" className="bg-slate-950">Nefret Söylemi / Ayrımcılık</option>
                  <option value="Taciz / Tehdit" className="bg-slate-950">Taciz / Tehdit</option>
                  <option value="Diğer / Kurallara Aykırı" className="bg-slate-950">Diğer / Kurallara Aykırı</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2.5 text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={reporting}
                  className="rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-rose-500/20 hover:shadow-rose-500/45 transition duration-150 cursor-pointer"
                >
                  {reporting ? "İletiliyor..." : "Şikayeti İlet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SectionPanel>
  );
}

