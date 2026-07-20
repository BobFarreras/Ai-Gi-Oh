// src/components/hub/home/HomeDeckSlotControls.tsx - Controles del Doble Arsenal integrados en el header del
// Arsenal (ficha 8). Desktop: toggle inline "Principal / 2º mazo" + "Hacer principal". Móvil: un desplegable
// (icono) para cambiar la vista; el "Hacer principal" en móvil vive en el panel del deck. Solo se renderiza si
// el jugador tiene la habilidad (secondDeck != null).
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Layers, Star } from "lucide-react";
import { ISecondDeckControls } from "@/components/hub/home/layout/home-workspace-types";

export function HomeDeckSlotControls({ secondDeck }: { secondDeck: ISecondDeckControls }) {
  const isSecondary = secondDeck.editingDeckSlot === "SECONDARY";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      {/* ── Desktop: toggle inline + hacer principal ────────────────────────────────── */}
      <div className="hidden items-center gap-1.5 md:flex">
        <div className="flex items-center overflow-hidden rounded-lg border border-violet-400/40">
          {(["PRINCIPAL", "SECONDARY"] as const).map((slot) => {
            const active = secondDeck.editingDeckSlot === slot;
            return (
              <button
                key={slot}
                type="button"
                disabled={secondDeck.busy}
                onClick={() => secondDeck.onSwitch(slot)}
                className={`px-2.5 py-1 font-display text-[10px] uppercase tracking-widest transition disabled:opacity-50 ${
                  active ? "bg-violet-500/30 text-violet-100" : "bg-transparent text-slate-300 hover:bg-violet-500/10"
                }`}
              >
                {slot === "PRINCIPAL" ? "Principal" : "2º mazo"}
              </button>
            );
          })}
        </div>
        {isSecondary && (
          <button
            type="button"
            disabled={secondDeck.busy}
            onClick={secondDeck.onActivate}
            className="inline-flex items-center gap-1 rounded-lg border border-violet-400/60 bg-violet-500/20 px-2 py-1 font-display text-[10px] uppercase tracking-widest text-violet-100 transition enabled:hover:bg-violet-500/30 disabled:opacity-50"
          >
            <Star className="h-3 w-3" />
            {secondDeck.busy ? "…" : "Hacer principal"}
          </button>
        )}
      </div>

      {/* ── Móvil: desplegable (icono) para cambiar la vista ────────────────────────── */}
      <div ref={ref} className="relative md:hidden">
        <button
          type="button"
          disabled={secondDeck.busy}
          onClick={() => setOpen((v) => !v)}
          aria-label="Cambiar de mazo"
          className="inline-flex items-center gap-1 rounded-lg border border-violet-400/45 bg-violet-500/10 px-2 py-1 text-violet-200 transition enabled:hover:bg-violet-500/20 disabled:opacity-50"
        >
          <Layers className="h-4 w-4" />
          <span className="font-display text-[10px] font-black">{isSecondary ? "2" : "1"}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {open && (
          <div className="absolute left-0 top-full z-30 mt-1 w-36 overflow-hidden rounded-lg border border-violet-400/40 bg-[#0a0714]/95 shadow-[0_8px_24px_rgba(0,0,0,0.5)] backdrop-blur">
            {(["PRINCIPAL", "SECONDARY"] as const).map((slot) => {
              const active = secondDeck.editingDeckSlot === slot;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => { secondDeck.onSwitch(slot); setOpen(false); }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left font-display text-[11px] uppercase tracking-widest transition ${
                    active ? "bg-violet-500/25 text-violet-100" : "text-slate-200 hover:bg-violet-500/10"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5 opacity-70" />
                  {slot === "PRINCIPAL" ? "Ver principal" : "Ver 2º mazo"}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
