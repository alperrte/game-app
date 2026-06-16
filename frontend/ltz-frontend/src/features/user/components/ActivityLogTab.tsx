import React, { useState, useEffect } from "react";
import { useToast } from "../../../components/ui/toastContext";
import { userService } from "../services/userService";
import type { UserAuditLog } from "../types/user";
import { Terminal, RefreshCw } from "lucide-react";

const formatTimestamp = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleString("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const getActionColor = (action: string) => {
  if (action.includes("CREATE")) return "text-emerald-400 font-bold";
  if (action.includes("UPDATE")) return "text-violet-400 font-bold";
  if (action.includes("DISCONNECT") || action.includes("DELETE")) return "text-rose-400 font-bold";
  return "text-sky-400 font-bold";
};

export const ActivityLogTab: React.FC = () => {
  const [logs, setLogs] = useState<UserAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-white tracking-wide flex items-center gap-2">
            <Terminal className="h-5 w-5 text-violet-400" /> Hesap Geçmişi
          </h2>
          <p className="text-sm text-zinc-400">
            Hesabınızda gerçekleşen kritik eylemlerin güvenli işlem kayıt defteri.
          </p>
        </div>

        <button
          onClick={() => void loadLogs(true)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:border-zinc-700 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Yenile
        </button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/20 p-8 text-center">
          <p className="text-sm text-zinc-500">Kayıtlı herhangi bir işlem geçmişi bulunamadı.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 px-4 py-2">
            <span className="font-mono text-[10px] tracking-wider text-zinc-500">
              LTZ-USER-AUDIT-MONITOR://SYS-LOG.DAT
            </span>
            <span className="font-mono text-[10px] text-zinc-600">LOGS: {logs.length}</span>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-5 font-mono text-xs text-zinc-400 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="border-l border-zinc-800 pl-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-zinc-600">[{formatTimestamp(log.createdAt)}]</span>
                    <span className={getActionColor(log.action)}>{log.action}</span>
                  </div>
                  {log.ipAddress && (
                    <span className="text-[10px] text-zinc-600">IP: {log.ipAddress}</span>
                  )}
                </div>
                {log.details && (
                  <p className="mt-1 text-zinc-300 font-medium pl-2 border-l border-zinc-900/50 text-xs">
                    &gt; {log.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
