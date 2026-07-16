// src/components/admin/internal/DetailBonusControls.tsx - Controles compartidos del detalle de carta admin
// (arena y story): sección plegable y contador de objetos por stat con +/-. Se comparten para que ambos
// editores tengan la misma UX de "equipar objetos".
"use client";

import { ReactNode } from "react";

/** Sección plegable (plegada por defecto) para que no le coma espacio a la carta del detalle. */
export function CollapsibleSection({ title, accent, defaultOpen = false, children }: { title: string; accent: "cyan" | "fuchsia"; defaultOpen?: boolean; children: ReactNode }) {
  const border = accent === "cyan" ? "border-cyan-800/30" : "border-fuchsia-800/30";
  const bg = accent === "cyan" ? "bg-[#031020]/55" : "bg-[#0a0716]/55";
  const text = accent === "cyan" ? "text-cyan-300" : "text-fuchsia-300";
  return (
    <details open={defaultOpen} className={`group shrink-0 rounded-xl border ${border} ${bg} text-xs text-slate-200`}>
      <summary className={`flex cursor-pointer list-none items-center justify-between p-3 font-black uppercase tracking-[0.18em] ${text}`}>
        {title}
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current transition-transform group-open:rotate-180"><path d="M6 9l6 6 6-6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}

/** Contador de objetos por stat: valor actual (+N) con botones - / + que quitan/añaden un objeto (su valor). */
export function BonusStepper({ label, colorClass, value, step, disabled, onAdd, onRemove }: { label: string; colorClass: string; value: number; step: number; disabled: boolean; onAdd: () => void; onRemove: () => void }) {
  const btn = "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-fuchsia-800/50 bg-[#0a0716] text-sm font-black text-fuchsia-200 transition hover:bg-fuchsia-950/50 disabled:opacity-40";
  return (
    <div className="rounded-lg border border-fuchsia-900/40 bg-[#0a0716]/70 p-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-1">
        <button type="button" aria-label={`Quitar objeto de ${label.toLowerCase()}`} className={btn} disabled={disabled || value <= 0} onClick={onRemove}>−</button>
        <span className={`font-mono text-sm font-black ${colorClass}`}>+{value}</span>
        <button type="button" aria-label={`Añadir objeto de ${label.toLowerCase()}`} className={btn} disabled={disabled} onClick={onAdd}>+</button>
      </div>
      <p className="mt-0.5 text-center text-[9px] text-slate-500">+{step} por objeto</p>
    </div>
  );
}
