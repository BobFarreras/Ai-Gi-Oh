// src/components/admin/internal/AdminMissionRow.tsx - Fila editable de una misión (acción/colección, recompensa Nexus o puntos de evento) en el panel admin.
"use client";

import { useState } from "react";
import { IAdminMissionDefinition } from "@/core/entities/progression/ILiveOpsAdmin";
import { MissionScope } from "@/core/entities/progression/IMission";
import { MISSION_OBJECTIVE_TYPES, OBJECTIVE_TYPES_WITH_PARAM, progressionActionLabel } from "@/core/services/progression/action-labels";
import { LiveOpsField, LiveOpsNumber, LiveOpsToggle, LiveOpsSaveBar } from "./live-ops/live-ops-controls";
import { saveLiveOps } from "./live-ops/save-live-ops";

const SCOPES: { value: MissionScope; label: string }[] = [
  { value: "DAILY", label: "Diaria" },
  { value: "WEEKLY", label: "Semanal" },
  { value: "EVENT", label: "Evento (una vez)" },
];
const SELECT_CLASS = "border border-cyan-900/60 bg-[#03101c] px-2 py-1 text-sm text-slate-100 outline-none focus:border-cyan-400";

export function AdminMissionRow({ mission, events }: { mission: IAdminMissionDefinition; events: { id: string; name: string }[] }) {
  const [draft, setDraft] = useState<IAdminMissionDefinition>(mission);
  function update<K extends keyof IAdminMissionDefinition>(key: K, value: IAdminMissionDefinition[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }
  const needsParam = OBJECTIVE_TYPES_WITH_PARAM.has(draft.objectiveType);
  const isEventReward = draft.rewardType === "EVENT_POINTS";

  function changeObjective(objectiveType: string) {
    const param = OBJECTIVE_TYPES_WITH_PARAM.has(objectiveType) ? draft.objectiveParam ?? 1 : null;
    setDraft((prev) => ({ ...prev, objectiveType, objectiveParam: param }));
  }
  function changeRewardType(rewardType: "NEXUS" | "EVENT_POINTS") {
    setDraft((prev) => ({
      ...prev,
      rewardType,
      eventId: rewardType === "EVENT_POINTS" ? prev.eventId ?? events[0]?.id ?? null : null,
      scope: rewardType === "EVENT_POINTS" ? "EVENT" : prev.scope === "EVENT" ? "WEEKLY" : prev.scope,
    }));
  }

  return (
    <div className="border border-cyan-900/50 bg-[#03101c]/80 p-4" style={{ clipPath: "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)" }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select className={SELECT_CLASS} value={draft.scope} onChange={(event) => update("scope", event.target.value as MissionScope)}>
          {SCOPES.map((scope) => <option key={scope.value} value={scope.value}>{scope.label}</option>)}
        </select>
        <select className={`${SELECT_CLASS} flex-1`} value={draft.objectiveType} onChange={(event) => changeObjective(event.target.value)}>
          {MISSION_OBJECTIVE_TYPES.map((type) => <option key={type} value={type}>{progressionActionLabel(type)}</option>)}
        </select>
        <span className="font-mono text-[10px] text-slate-600">{draft.id}</span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select className={SELECT_CLASS} value={draft.rewardType} onChange={(event) => changeRewardType(event.target.value as "NEXUS" | "EVENT_POINTS")}>
          <option value="NEXUS">Recompensa: Nexus</option>
          <option value="EVENT_POINTS">Recompensa: Puntos de evento</option>
        </select>
        {isEventReward ? (
          <select className={`${SELECT_CLASS} flex-1`} value={draft.eventId ?? ""} onChange={(event) => update("eventId", event.target.value || null)}>
            <option value="">— Evento —</option>
            {events.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><LiveOpsField label="Título" value={draft.title} onChange={(value) => update("title", value)} /></div>
        <LiveOpsNumber label="Cantidad objetivo" value={draft.targetCount} min={1} onChange={(value) => update("targetCount", value)} />
        {needsParam ? <LiveOpsNumber label="Umbral (nivel/versión)" value={draft.objectiveParam ?? 1} min={1} onChange={(value) => update("objectiveParam", value)} /> : null}
        <LiveOpsNumber label={isEventReward ? "Recompensa (puntos)" : "Recompensa Nexus"} value={draft.rewardNexus} onChange={(value) => update("rewardNexus", value)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <LiveOpsToggle label="Misión" checked={draft.isActive} onChange={(value) => update("isActive", value)} />
        <LiveOpsSaveBar onSave={() => saveLiveOps("mission", draft)} />
      </div>
    </div>
  );
}
