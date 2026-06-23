// src/components/hub/progression/MissionsPanel.tsx - Panel de misiones diarias/semanales con progreso y claim de recompensa.
"use client";

import { useState } from "react";
import { IMissionView } from "@/core/entities/progression/IMission";
import { track } from "@/services/analytics/client/analytics-buffer";

interface IMissionsPanelProps {
  missions: IMissionView[];
  onClose: () => void;
}

function MissionRow({ mission, onClaimed }: { mission: IMissionView; onClaimed: (missionId: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [claimed, setClaimed] = useState(mission.claimed);
  const [error, setError] = useState(false);
  const pct = Math.min(100, Math.round((mission.progress / mission.targetCount) * 100));
  const canClaim = mission.completed && !claimed;

  async function handleClaim() {
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/progression/missions/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ missionId: mission.missionId, periodKey: mission.periodKey }),
      });
      if (!response.ok) throw new Error("claim failed");
      setClaimed(true);
      onClaimed(mission.missionId);
      track("mission_claimed", "system", { missionId: mission.missionId, scope: mission.scope, rewardNexus: mission.rewardNexus });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-100">{mission.title}</p>
          <p className="truncate text-[11px] text-slate-400">{mission.description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-300">+{mission.rewardNexus}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
          <div className={`absolute inset-y-0 left-0 rounded-full ${claimed ? "bg-emerald-500" : "bg-cyan-500"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="w-12 shrink-0 text-right font-mono text-[11px] text-slate-400">{Math.min(mission.progress, mission.targetCount)}/{mission.targetCount}</span>
      </div>
      <div className="mt-2">
        {claimed ? (
          <p className="text-center text-[11px] font-bold uppercase tracking-wider text-emerald-400">Reclamada ✓</p>
        ) : (
          <button
            type="button"
            disabled={!canClaim || busy}
            className="h-8 w-full rounded-lg bg-cyan-500 text-[11px] font-black uppercase tracking-wider text-slate-950 transition hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500"
            onClick={handleClaim}
          >
            {busy ? "Reclamando…" : canClaim ? "Reclamar" : "En progreso"}
          </button>
        )}
        {error ? <p className="mt-1 text-center text-[10px] text-rose-300">No se pudo reclamar.</p> : null}
      </div>
    </div>
  );
}

export function MissionsPanel({ missions, onClose }: IMissionsPanelProps) {
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const markClaimed = (missionId: string) => setClaimedIds((prev) => new Set(prev).add(missionId));

  const daily = missions.filter((mission) => mission.scope === "DAILY");
  const weekly = missions.filter((mission) => mission.scope === "WEEKLY");

  const renderGroup = (title: string, list: IMissionView[]) =>
    list.length > 0 ? (
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-300">{title}</h3>
        {list.map((mission) => (
          <MissionRow key={mission.missionId} mission={{ ...mission, claimed: mission.claimed || claimedIds.has(mission.missionId) }} onClaimed={markClaimed} />
        ))}
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Misiones" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-cyan-800/60 bg-slate-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-widest text-cyan-100">Misiones</h2>
          <button type="button" aria-label="Cerrar" className="h-7 w-7 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800" onClick={onClose}>✕</button>
        </div>
        {missions.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">No hay misiones disponibles.</p>
        ) : (
          <>
            {renderGroup("Diarias", daily)}
            {renderGroup("Semanales", weekly)}
          </>
        )}
      </div>
    </div>
  );
}
