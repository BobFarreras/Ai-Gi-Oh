// src/components/admin/AdminEffectsGlossaryPanel.tsx - Glosario admin de todos los efectos del juego (pasivas, ejecuciones, trampas, innatos y triggers) con buscador.
"use client";

import { useMemo, useState } from "react";
import { EFFECT_CATALOG } from "@/core/services/effects/effect-catalog";
import { EffectCategory, IEffectCatalogItem } from "@/core/services/effects/effect-catalog-types";

const CATEGORY_ORDER: EffectCategory[] = ["PASSIVE", "EXECUTION", "TRAP", "ENTITY", "TRAP_TRIGGER"];
const CATEGORY_LABELS: Record<EffectCategory, string> = {
  PASSIVE: "Pasivas V5 (Maestría)",
  EXECUTION: "Ejecuciones (Magia)",
  TRAP: "Trampas",
  ENTITY: "Innatos de Entity",
  TRAP_TRIGGER: "Triggers de Trampa",
};

function matchesQuery(item: IEffectCatalogItem, query: string): boolean {
  const haystack = `${item.name} ${item.description} ${item.key}`.toLowerCase();
  return haystack.includes(query);
}

function GlossaryItem({ item }: { item: IEffectCatalogItem }) {
  return (
    <li className="rounded-lg border border-slate-700/70 bg-slate-950/50 p-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <p className="text-xs font-bold text-cyan-100">{item.name}</p>
        <code className="font-mono text-[10px] text-slate-500">{item.key}</code>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{item.description}</p>
      {item.exampleJson ? <code className="mt-1.5 block overflow-x-auto rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-emerald-300">{item.exampleJson}</code> : null}
    </li>
  );
}

export function AdminEffectsGlossaryPanel() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      CATEGORY_ORDER.map((category) => ({
        category,
        items: EFFECT_CATALOG.filter((item) => item.category === category && (normalizedQuery === "" || matchesQuery(item, normalizedQuery))),
      })).filter((group) => group.items.length > 0),
    [normalizedQuery],
  );

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="rounded-xl border border-cyan-800/50 bg-[linear-gradient(120deg,rgba(4,14,30,0.96),rgba(2,9,20,0.98))] px-4 py-3">
        <h1 className="text-sm font-black uppercase tracking-widest text-cyan-100">Glosario de Efectos</h1>
        <p className="text-[10px] text-slate-400">Referencia de pasivas, ejecuciones, trampas e innatos del juego.</p>
        <input
          aria-label="Buscar efecto"
          className="mt-2 w-full rounded-md border border-slate-600 bg-slate-900 p-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
          placeholder="Buscar por nombre, descripción o id técnico…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="home-modern-scroll min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        {groups.length === 0 ? <p className="text-xs text-slate-400">Sin efectos que coincidan con la búsqueda.</p> : null}
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="mb-2 text-[11px] font-black uppercase tracking-wider text-fuchsia-300">
              {CATEGORY_LABELS[group.category]} <span className="text-slate-500">({group.items.length})</span>
            </h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {group.items.map((item) => (
                <GlossaryItem key={`${group.category}-${item.key}`} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
