// src/components/admin/internal/AdminEventChallengeRow.tsx - Fila simplificada de un reto de evento (misión scope EVENT que da la moneda del evento). Edición mínima: objetivo, nº de cartas/cantidad, umbral y recompensa. Scope/recompensa/evento van forzados (no se editan aquí).
"use client";

import { useState } from "react";
import { IAdminMissionDefinition } from "@/core/entities/progression/ILiveOpsAdmin";
import { COLLECTION_OBJECTIVE_TYPES, MISSION_OBJECTIVE_TYPES, OBJECTIVE_TYPES_WITH_PARAM, progressionActionLabel } from "@/core/services/progression/action-labels";
import { LiveOpsField, LiveOpsNumber, LiveOpsToggle, LiveOpsSaveBar } from "./live-ops/live-ops-controls";
import { saveLiveOps } from "./live-ops/save-live-ops";

const SELECT_CLASS = "flex-1 border border-cyan-900/60 bg-[#03101c] px-2 py-1 text-sm text-slate-100 outline-none focus:border-cyan-400";

/** Etiqueta del umbral según el objetivo (experiencia vs versión son cosas distintas). */
function thresholdLabel(objectiveType: string): string {
  if (objectiveType === "OWN_CARDS_AT_LEVEL") return "Nivel mínimo (experiencia)";
  if (objectiveType === "OWN_CARDS_AT_VERSION") return "Versión mínima";
  return "Umbral";
}
/** Etiqueta de la cantidad: "nº de cartas" para objetivos de colección, "cantidad" para acciones. */
function countLabel(objectiveType: string): string {
  return COLLECTION_OBJECTIVE_TYPES.has(objectiveType) ? "Nº de cartas" : "Cantidad";
}

export function AdminEventChallengeRow({ mission, currencyName, onDelete }: { mission: IAdminMissionDefinition; currencyName: string; onDelete: () => void }) {
  const [draft, setDraft] = useState<IAdminMissionDefinition>(mission);
  function update<K extends keyof IAdminMissionDefinition>(key: K, value: IAdminMissionDefinition[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }
  function changeObjective(objectiveType: string) {
    setDraft((prev) => ({
      ...prev,
      objectiveType,
      objectiveParam: OBJECTIVE_TYPES_WITH_PARAM.has(objectiveType) ? prev.objectiveParam ?? 1 : null,
    }));
  }
  const needsParam = OBJECTIVE_TYPES_WITH_PARAM.has(draft.objectiveType);

  return (
    <div className="border border-cyan-900/50 bg-[#03101c]/80 p-3" style={{ clipPath: "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)" }}>
      <div className="mb-2 flex items-center gap-2">
        <select aria-label="Objetivo del reto" className={SELECT_CLASS} value={draft.objectiveType} onChange={(event) => changeObjective(event.target.value)}>
          {MISSION_OBJECTIVE_TYPES.map((type) => <option key={type} value={type}>{progressionActionLabel(type)}</option>)}
        </select>
        <span className="font-mono text-[10px] text-slate-600">{draft.id}</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="sm:col-span-2"><LiveOpsField label="Título (lo ve el jugador)" value={draft.title} onChange={(value) => update("title", value)} /></div>
        <LiveOpsNumber label={countLabel(draft.objectiveType)} value={draft.targetCount} min={1} onChange={(value) => update("targetCount", value)} />
        {needsParam ? <LiveOpsNumber label={thresholdLabel(draft.objectiveType)} value={draft.objectiveParam ?? 1} min={1} onChange={(value) => update("objectiveParam", value)} /> : null}
        <LiveOpsNumber label={`Recompensa (${currencyName})`} value={draft.rewardNexus} min={1} onChange={(value) => update("rewardNexus", value)} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
        <LiveOpsToggle label="Reto" checked={draft.isActive} onChange={(value) => update("isActive", value)} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Eliminar reto"
            onClick={onDelete}
            className="flex h-9 w-9 shrink-0 items-center justify-center border border-rose-700/60 text-rose-300 transition-colors hover:border-rose-500 hover:bg-rose-500/10"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" /></svg>
          </button>
          <LiveOpsSaveBar onSave={() => saveLiveOps("mission", draft)} />
        </div>
      </div>
    </div>
  );
}
