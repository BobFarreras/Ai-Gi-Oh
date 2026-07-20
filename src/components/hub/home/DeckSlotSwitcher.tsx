// src/components/hub/home/DeckSlotSwitcher.tsx - Barra del Doble Arsenal (ficha 8). Muestra qué mazo se está
// editando (principal/activo o 2º mazo) y ofrece: cambiar la VISTA al otro mazo, y "Hacer principal" (activar)
// cuando estás en el 2º mazo → intercambia activo <-> banco. Responsive (desktop y móvil). Solo aparece si el
// jugador tiene desbloqueada la habilidad.
"use client";

import { ArrowLeftRight, Layers, Star } from "lucide-react";

interface DeckSlotSwitcherProps {
  editingDeckSlot: "PRINCIPAL" | "SECONDARY";
  busy: boolean;
  onSwitch: (slot: "PRINCIPAL" | "SECONDARY") => void;
  onActivate: () => void;
}

export function DeckSlotSwitcher({ editingDeckSlot, busy, onSwitch, onActivate }: DeckSlotSwitcherProps) {
  const isSecondary = editingDeckSlot === "SECONDARY";
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/5 px-3 py-2 sm:mb-3 sm:gap-3 sm:px-4">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 shrink-0 text-violet-300" />
        <span className="font-display text-[11px] uppercase tracking-widest text-slate-200 sm:text-xs">
          Editando:{" "}
          <span className={isSecondary ? "text-violet-200" : "text-cyan-200"}>
            {isSecondary ? "2º mazo" : "Mazo principal"}
          </span>
          {!isSecondary && <span className="ml-1 text-[9px] text-emerald-300/80 sm:text-[10px]">(activo)</span>}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => onSwitch(isSecondary ? "PRINCIPAL" : "SECONDARY")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500/50 bg-slate-900/60 px-2.5 py-1.5 font-display text-[10px] uppercase tracking-widest text-slate-200 transition enabled:hover:border-slate-300 enabled:hover:bg-slate-800/70 disabled:opacity-50 sm:px-3 sm:text-[11px]"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {isSecondary ? "Ver principal" : "Ver 2º mazo"}
        </button>

        {isSecondary && (
          <button
            type="button"
            disabled={busy}
            onClick={onActivate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/60 bg-violet-500/20 px-2.5 py-1.5 font-display text-[10px] uppercase tracking-widest text-violet-100 shadow-[0_0_14px_rgba(167,139,250,0.25)] transition enabled:hover:bg-violet-500/30 disabled:opacity-50 sm:px-3 sm:text-[11px]"
          >
            <Star className="h-3.5 w-3.5" />
            {busy ? "Activando…" : "Hacer principal"}
          </button>
        )}
      </div>
    </div>
  );
}
