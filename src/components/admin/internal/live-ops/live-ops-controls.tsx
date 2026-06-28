// src/components/admin/internal/live-ops/live-ops-controls.tsx - Átomos de formulario del panel Live-Ops (estilo del juego) + barra de guardado y selector de carta con preview y buscador.
"use client";

import { useEffect, useMemo, useState } from "react";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";

interface ILightCard {
  id: string;
  name: string;
  type: string;
  cost: number;
}

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
  const [allCards, setAllCards] = useState<ILightCard[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/catalog/cards").then((r) => r.json()).then((data) => {
      if (Array.isArray(data)) setAllCards(data);
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return allCards;
    const q = search.toLowerCase();
    return allCards.filter((c) => c.id.includes(q) || c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q));
  }, [allCards, search]);

  const selectedCard = CARD_BY_ID.get(cardId);
  const selectedLight = allCards.find((c) => c.id === cardId);

  return (
    <div className="flex items-end gap-3">
      <div className="relative aspect-[13/19] w-16 shrink-0">
        {selectedCard ? <CardThumbnail card={selectedCard} /> : selectedLight ? (
          <div className="flex h-full w-full items-center justify-center border border-slate-700 bg-slate-900 text-[9px] text-slate-400 text-center px-1">{selectedLight.name}</div>
        ) : <div className="flex h-full w-full items-center justify-center border border-slate-700 bg-slate-900 text-[9px] text-slate-500">?</div>}
      </div>
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-500/70">Carta</span>
        <input
          className={INPUT_CLASS}
          placeholder="Buscar carta..."
          value={open ? search : (selectedLight?.name ?? cardId)}
          onFocus={() => { setOpen(true); setSearch(""); }}
          onBlur={() => { setTimeout(() => setOpen(false), 200); }}
          onChange={(e) => setSearch(e.target.value)}
        />
        {open && (
          <div className="relative z-50 max-h-60 overflow-y-auto border border-cyan-900/60 bg-[#03101c]">
            <button
              type="button"
              className={`w-full px-2.5 py-1.5 text-left text-sm transition-colors ${cardId === "" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-400 hover:bg-cyan-500/10"}`}
              onMouseDown={() => { onChange(""); setSearch(""); }}
            >
              — Selecciona —
            </button>
            {filtered.map((entry) => (
              <button
                type="button"
                key={entry.id}
                className={`w-full px-2.5 py-1.5 text-left text-sm transition-colors ${entry.id === cardId ? "bg-cyan-500/20 text-cyan-300" : "text-slate-300 hover:bg-cyan-500/10"}`}
                onMouseDown={() => { onChange(entry.id); setSearch(""); }}
              >
                {entry.name} <span className="text-[10px] text-slate-500">({entry.type} c{entry.cost})</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="px-2.5 py-2 text-xs text-slate-500">Sin resultados</div>}
          </div>
        )}
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
