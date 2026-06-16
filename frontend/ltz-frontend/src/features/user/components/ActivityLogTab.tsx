import React, { useState, useEffect } from "react";
import { Clock, Globe, Monitor, RefreshCw, Shield } from "lucide-react";

import { useToast } from "../../../components/ui/toastContext";
import { useAuthStore } from "../../../store/authStore";
import { userService } from "../services/userService";
import type { UserAuditLog } from "../types/audit";
import { SectionPanel } from "./profile/ProfilePrimitives";
import {
  canViewSensitiveAuditFields,
  formatAuditDetails,
  getAuditActionLabel,
} from "../utils/auditLabels";

const formatTimestamp = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

export const ActivityLogTab: React.FC = () => {
  const [logs, setLogs] = useState<UserAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const showSensitive = canViewSensitiveAuditFields(user?.role);

  const loadLogs = async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await userService.getAuditLogs();
      setLogs(data);
    } catch {
      showToast("Aktivite günlükleri yüklenirken bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    userService
      .getAuditLogs()
      .then((data) => {
        if (active) setLogs(data);
      })
      .catch(() => {
        if (active) showToast("Aktivite günlükleri yüklenirken bir hata oluştu.", "error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  return (
    <SectionPanel
      title="Hesap Geçmişi"
      description="Hesabınızda gerçekleşen önemli işlemlerin özeti. IP ve cihaz bilgisi yalnızca yetkili rollerde görünür."
    >
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => void loadLogs(true)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-xs font-semibold text-zinc-400 transition-all hover:border-zinc-700 hover:text-white disabled:opacity-50"
          type="button"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Yenile
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/20 p-8 text-center">
          <p className="text-sm text-zinc-500">Kayıtlı işlem geçmişi bulunamadı.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <article
              key={log.id}
              className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">{getAuditActionLabel(log.action)}</p>
                  <p className="text-xs leading-relaxed text-zinc-400">{formatAuditDetails(log)}</p>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTimestamp(log.createdAt)}
                </div>
              </div>

              {showSensitive && (log.ipAddress || log.deviceInfo || log.userAgent) ? (
                <div className="mt-3 grid gap-2 rounded-lg border border-violet-500/15 bg-violet-500/5 p-3 text-[11px] text-zinc-400 md:grid-cols-3">
                  {log.ipAddress ? (
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-violet-400" />
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  ) : null}
                  {log.deviceInfo ? (
                    <div className="flex items-center gap-1.5">
                      <Monitor className="h-3.5 w-3.5 text-violet-400" />
                      <span>{log.deviceInfo}</span>
                    </div>
                  ) : null}
                  {log.userAgent ? (
                    <div className="flex items-center gap-1.5 md:col-span-3">
                      <Shield className="h-3.5 w-3.5 text-violet-400" />
                      <span className="truncate" title={log.userAgent}>
                        {log.userAgent}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </SectionPanel>
  );
};
