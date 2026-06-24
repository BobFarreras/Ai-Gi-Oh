// src/components/hub/progression/MissionsPanel.tsx - Diálogo táctico de misiones diarias/semanales con progreso y claim de recompensa.
"use client";

import { useState } from "react";
import { IMissionView } from "@/core/entities/progression/IMission";
import { track } from "@/services/analytics/client/analytics-buffer";
import { ProgressionDialogShell } from "./internal/ProgressionDialogShell";

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
    <div
      className="border border-cyan-900/50 bg-[#03101c]/80 p-3"
      style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-100">{mission.title}</p>
          <p className="truncate text-[11px] text-slate-400">{mission.description}</p>
        </div>
        <span className="shrink-0 border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-black text-amber-300">+{mission.rewardNexus}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <div className="relative h-2 flex-1 overflow-hidden border border-cyan-900/60 bg-black/60">
          <div className={`absolute inset-y-0 left-0 ${claimed ? "bg-emerald-500" : "bg-cyan-400"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="w-12 shrink-0 text-right font-mono text-[11px] text-slate-400">{Math.min(mission.progress, mission.targetCount)}/{mission.targetCount}</span>
      </div>
      <div className="mt-2.5">
        {claimed ? (
          <p className="text-center font-mono text-[11px] font-black uppercase tracking-[0.16em] text-emerald-400">Reclamada ✓</p>
        ) : (
          <button
            type="button"
            disabled={!canClaim || busy}
            className="h-8 w-full bg-cyan-500 font-mono text-[11px] font-black uppercase tracking-[0.16em] text-slate-950 transition hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600"
            style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
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
        <h3 className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/70">{title}</h3>
        {list.map((mission) => (
          <MissionRow key={mission.missionId} mission={{ ...mission, claimed: mission.claimed || claimedIds.has(mission.missionId) }} onClaimed={markClaimed} />
        ))}
      </div>
    ) : null;

  return (
    <ProgressionDialogShell
      title="Misiones"
      subtitle="Objetivos diarios y semanales"
      onClose={onClose}
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      }
    >
      {missions.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">No hay misiones disponibles.</p>
      ) : (
        <div className="space-y-4">
          {renderGroup("Diarias", daily)}
          {renderGroup("Semanales", weekly)}
        </div>
      )}
    </ProgressionDialogShell>
  );
}
