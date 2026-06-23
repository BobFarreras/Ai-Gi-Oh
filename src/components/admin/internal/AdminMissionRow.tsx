// src/components/admin/internal/AdminMissionRow.tsx - Fila editable de una misión en el panel admin de live-ops.
"use client";

import { useState } from "react";
import { IAdminMissionDefinition } from "@/core/entities/progression/ILiveOpsAdmin";

type SaveState = "idle" | "saving" | "ok" | "error";

export function AdminMissionRow({ mission }: { mission: IAdminMissionDefinition }) {
  const [draft, setDraft] = useState<IAdminMissionDefinition>(mission);
  const [state, setState] = useState<SaveState>("idle");

  function update<K extends keyof IAdminMissionDefinition>(key: K, value: IAdminMissionDefinition[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  }

  async function handleSave() {
    setState("saving");
    try {
      const response = await fetch("/api/admin/progression/missions", {
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
        <span className="rounded bg-slate-700/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300">{draft.scope}</span>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-fuchsia-300">{draft.objectiveType}</span>
        <span className="ml-auto font-mono text-[10px] text-slate-500">{draft.id}</span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <input
          aria-label="Título"
          className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
          value={draft.title}
          onChange={(event) => update("title", event.target.value)}
        />
        <label className="flex items-center gap-1 text-[10px] text-slate-400">
          Objetivo
          <input
            aria-label="Cantidad objetivo"
            type="number"
            min={1}
            className="w-16 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
            value={draft.targetCount}
            onChange={(event) => update("targetCount", Number(event.target.value))}
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-slate-400">
          Nexus
          <input
            aria-label="Recompensa Nexus"
            type="number"
            min={0}
            className="w-20 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-100"
            value={draft.rewardNexus}
            onChange={(event) => update("rewardNexus", Number(event.target.value))}
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-slate-400">
          Activa
          <input
            aria-label="Activa"
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => update("isActive", event.target.checked)}
          />
        </label>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={state === "saving"}
          className="h-7 rounded-md bg-cyan-500 px-3 text-[11px] font-black uppercase tracking-wide text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
          onClick={handleSave}
        >
          {state === "saving" ? "Guardando…" : "Guardar"}
        </button>
        {state === "ok" ? <span className="text-[11px] text-emerald-300">Guardado ✓</span> : null}
        {state === "error" ? <span className="text-[11px] text-rose-300">Error al guardar</span> : null}
      </div>
    </div>
  );
}
