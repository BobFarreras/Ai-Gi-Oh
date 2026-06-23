// src/components/admin/internal/AdminPromotionRow.tsx - Fila editable de una promoción/noticia en el panel admin de live-ops.
"use client";

import { useState } from "react";
import { IAdminPromotionConfig } from "@/core/entities/progression/ILiveOpsAdmin";

type SaveState = "idle" | "saving" | "ok" | "error";

export function AdminPromotionRow({ promotion }: { promotion: IAdminPromotionConfig }) {
  const [draft, setDraft] = useState<IAdminPromotionConfig>(promotion);
  const [state, setState] = useState<SaveState>("idle");

  function update<K extends keyof IAdminPromotionConfig>(key: K, value: IAdminPromotionConfig[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  }

  async function handleSave() {
    setState("saving");
    try {
      const response = await fetch("/api/admin/progression/promotions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(draft),
      });
      setState(response.ok ? "ok" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-slate-700/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300">{draft.kind}</span>
        <span className="ml-auto font-mono text-[10px] text-slate-500">{draft.id}</span>
      </div>
      <div className="space-y-2">
        <input
          aria-label="Título"
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
          value={draft.title}
          onChange={(event) => update("title", event.target.value)}
        />
        <textarea
          aria-label="Cuerpo"
          rows={2}
          className="w-full rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
          value={draft.body ?? ""}
          onChange={(event) => update("body", event.target.value)}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            aria-label="Texto del botón (CTA)"
            placeholder="Texto botón"
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
            value={draft.ctaLabel ?? ""}
            onChange={(event) => update("ctaLabel", event.target.value)}
          />
          <input
            aria-label="Enlace del botón (CTA)"
            placeholder="/hub/market"
            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
            value={draft.ctaHref ?? ""}
            onChange={(event) => update("ctaHref", event.target.value)}
          />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          disabled={state === "saving"}
          className="h-7 rounded-md bg-cyan-500 px-3 text-[11px] font-black uppercase tracking-wide text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          onClick={handleSave}
        >
          {state === "saving" ? "Guardando…" : "Guardar"}
        </button>
        <label className="flex items-center gap-1 text-[10px] text-slate-400">
          <input type="checkbox" checked={draft.isActive} onChange={(event) => update("isActive", event.target.checked)} />
          Activa
        </label>
        {state === "ok" ? <span className="text-[11px] text-emerald-300">Guardado ✓</span> : null}
        {state === "error" ? <span className="text-[11px] text-rose-300">Error al guardar</span> : null}
      </div>
    </div>
  );
}
