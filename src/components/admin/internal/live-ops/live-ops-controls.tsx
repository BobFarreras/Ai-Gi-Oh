// src/components/admin/internal/live-ops/live-ops-controls.tsx - Átomos de formulario del panel Live-Ops (estilo del juego) + barra de guardado y selector de carta con preview.
"use client";

import { useState } from "react";
import { CARD_CATALOG, CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";

const INPUT_CLASS = "w-full border border-cyan-900/60 bg-[#03101c] px-2.5 py-1.5 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-400";

export function LiveOpsField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-500/70">{label}</span>
      <input className={INPUT_CLASS} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function LiveOpsNumber({ label, value, onChange, min = 0 }: { label: string; value: number; onChange: (value: number) => void; min?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-500/70">{label}</span>
      <input type="number" min={min} className={INPUT_CLASS} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export function LiveOpsToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${checked ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-900/60 text-slate-400"}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${checked ? "bg-emerald-400" : "bg-slate-600"}`} />
      {label}: {checked ? "Activa" : "Inactiva"}
    </button>
  );
}

export function LiveOpsCardPicker({ cardId, onChange }: { cardId: string; onChange: (cardId: string) => void }) {
  const card = CARD_BY_ID.get(cardId);
  return (
    <div className="flex items-end gap-3">
      <div className="relative aspect-[13/19] w-16 shrink-0">
        {card ? <CardThumbnail card={card} /> : <div className="flex h-full w-full items-center justify-center border border-slate-700 bg-slate-900 text-[9px] text-slate-500">?</div>}
      </div>
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-500/70">Carta</span>
        <select className={INPUT_CLASS} value={cardId} onChange={(event) => onChange(event.target.value)}>
          <option value="">— Selecciona —</option>
          {CARD_CATALOG.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.name} ({entry.type})</option>
          ))}
        </select>
      </label>
    </div>
  );
}

/** Barra de guardado con estado. onSave devuelve true/false. */
export function LiveOpsSaveBar({ onSave, label = "Guardar" }: { onSave: () => Promise<boolean>; label?: string }) {
  const [state, setState] = useState<"idle" | "saving" | "ok" | "error">("idle");
  async function handle() {
    setState("saving");
    setState((await onSave()) ? "ok" : "error");
  }
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={state === "saving"}
        onClick={handle}
        className="h-9 bg-cyan-500 px-4 font-mono text-xs font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
        style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
      >
        {state === "saving" ? "Guardando…" : label}
      </button>
      {state === "ok" ? <span className="font-mono text-xs text-emerald-300">Guardado ✓</span> : null}
      {state === "error" ? <span className="font-mono text-xs text-rose-300">Error al guardar</span> : null}
    </div>
  );
}
