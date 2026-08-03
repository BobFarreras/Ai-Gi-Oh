// src/components/admin/internal/pve/AdminPveVersionHistory.tsx - Historial read-only de versiones publicadas de una configuración PvE.
"use client";

import { PVE_SECTION, PVE_TITLE } from "@/components/admin/internal/pve/admin-pve-styles";

export interface IAdminPveVersionRow {
  version: number;
  isActive: boolean;
  publishedAtIso: string;
  summary: string;
}

function formatPublishedAt(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

/** Las versiones no se editan ni se borran: son el registro de qué reglas jugó cada partida. */
export function AdminPveVersionHistory({ title, rows }: { title: string; rows: IAdminPveVersionRow[] }) {
  return (
    <section className={PVE_SECTION}>
      <h2 className={`${PVE_TITLE} mb-2`}>{title} ({rows.length})</h2>
      {rows.length === 0 ? (
        <p className="text-[11px] text-slate-500">Todavía no hay ninguna versión publicada.</p>
      ) : (
        <ul className="space-y-1">
          {rows.map((row) => (
            <li
              key={row.version}
              className={`flex flex-wrap items-center gap-2 rounded border px-2 py-1.5 text-[11px] ${
                row.isActive ? "border-emerald-600/50 bg-emerald-950/25 text-emerald-200" : "border-slate-800/70 bg-slate-950/50 text-slate-400"
              }`}
            >
              <span className="font-black">v{row.version}</span>
              {row.isActive ? (
                <span className="rounded border border-emerald-500/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">Activa</span>
              ) : null}
              <span className="min-w-0 flex-1 truncate">{row.summary}</span>
              <span className="text-[10px] text-slate-500">{formatPublishedAt(row.publishedAtIso)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
