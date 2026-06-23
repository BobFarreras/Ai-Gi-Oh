// src/components/admin/internal/AdminAnalyticsUsersTable.tsx - Tabla de usuarios conectados recientemente con nickname, última sesión, nº de sesiones y dispositivo.
import { IRecentUsersProps } from "@/components/admin/internal/admin-analytics-panel.types";

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function AdminAnalyticsUsersTable({ data }: IRecentUsersProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Usuarios Conectados</h3>
      {data.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-500">Sin datos disponibles.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-1 pr-2 font-semibold">Jugador</th>
                <th className="py-1 pr-2 font-semibold">Email</th>
                <th className="py-1 pr-2 font-semibold">Última sesión</th>
                <th className="py-1 pr-2 text-right font-semibold">Sesiones</th>
                <th className="py-1 font-semibold">Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user) => (
                <tr key={user.userId} className="border-b border-slate-800/60 last:border-0">
                  <td className="py-1 pr-2 font-medium text-slate-200">{user.nickname}</td>
                  <td className="py-1 pr-2 text-slate-400">{user.email ?? "—"}</td>
                  <td className="py-1 pr-2 font-mono text-slate-400">{formatDate(user.lastSession)}</td>
                  <td className="py-1 pr-2 text-right font-mono text-slate-300">{user.sessions.toLocaleString()}</td>
                  <td className="py-1 text-slate-400">{user.deviceType ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
