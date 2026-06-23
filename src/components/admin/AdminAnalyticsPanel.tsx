// src/components/admin/AdminAnalyticsPanel.tsx - Panel read-only de analytics admin con KPIs y gráficos SVG de tendencias.
import { IAnalyticsDashboard } from "@/core/entities/analytics/IAnalyticsDashboard";
import { AdminAnalyticsDauChart } from "@/components/admin/internal/AdminAnalyticsDauChart";
import { AdminAnalyticsDevicePie } from "@/components/admin/internal/AdminAnalyticsDevicePie";
import { AdminAnalyticsTopEventsChart } from "@/components/admin/internal/AdminAnalyticsTopEventsChart";
import { AdminAnalyticsTopPlayers } from "@/components/admin/internal/AdminAnalyticsTopPlayers";
import { AdminAnalyticsCardRanking } from "@/components/admin/internal/AdminAnalyticsCardRanking";
import { AdminAnalyticsUsersTable } from "@/components/admin/internal/AdminAnalyticsUsersTable";
import { AdminAnalyticsOnlineUsers } from "@/components/admin/internal/AdminAnalyticsOnlineUsers";

interface IAdminAnalyticsPanelProps {
  dashboard: IAnalyticsDashboard;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-cyan-100">{typeof value === "number" ? value.toLocaleString() : value}</p>
    </div>
  );
}

export function AdminAnalyticsPanel({ dashboard }: IAdminAnalyticsPanelProps) {
  const today = new Date().toISOString().slice(0, 10);
  const dauToday = dashboard.dau.find((d) => d.date === today)?.count ?? 0;

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-800/60 bg-slate-900/80">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-cyan-400" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M3 3v18h18" strokeLinecap="round" />
            <path d="M7 16l4-5 4 3 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-black uppercase tracking-widest text-cyan-100">Analytics</h1>
          <p className="text-[10px] text-slate-400">Dashboard de telemetría · Últimos 30 días</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <KpiCard label="Eventos (30d)" value={dashboard.totalEvents30d} />
        <KpiCard label="Sesiones (30d)" value={dashboard.totalSessions30d} />
        <KpiCard label="Duración Promedio" value={formatDuration(dashboard.avgSessionDurationSeconds)} />
        <KpiCard label="DAU Hoy" value={dauToday} />
      </div>

      <AdminAnalyticsDauChart data={dashboard.dau} />

      <div className="grid gap-3 md:grid-cols-2">
        <AdminAnalyticsTopPlayers data={dashboard.topPlayers} />
        <AdminAnalyticsCardRanking title="Cartas Más Usadas" data={dashboard.topCardsUsed} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <AdminAnalyticsCardRanking title="Cartas Más Compradas" data={dashboard.topCardsPurchased} />
        <AdminAnalyticsTopEventsChart data={dashboard.topEvents} />
      </div>

      <div className="grid gap-3 md:grid-cols-[minmax(0,18rem)_1fr]">
        <AdminAnalyticsOnlineUsers />
        <AdminAnalyticsUsersTable data={dashboard.recentUsers} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <AdminAnalyticsDevicePie data={dashboard.deviceDistribution} />
      </div>
    </section>
  );
}
