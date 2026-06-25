// src/components/hub/progression/MissionsPanel.tsx - Diálogo de misiones diarias/semanales con temporizador de regeneración, progreso y claim.
"use client";

import { useEffect, useState } from "react";
import { IMissionView } from "@/core/entities/progression/IMission";
import { formatResetCountdown, msUntilDailyReset, msUntilWeeklyReset } from "@/core/services/progression/reset-schedule";
import { track } from "@/services/analytics/client/analytics-buffer";
import { ProgressionDialogShell } from "./internal/ProgressionDialogShell";
import { FragmentIcon } from "./internal/FragmentIcon";

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
      className={`relative border bg-[#03101c]/80 p-3.5 transition-colors ${canClaim ? "border-amber-500/60 shadow-[0_0_16px_rgba(251,191,36,0.22)]" : "border-cyan-900/50"}`}
      style={{ clipPath: "polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-50">{mission.title}</p>
          <p className="text-sm text-slate-400">{mission.description}</p>
        </div>
        <span className={`flex shrink-0 items-center gap-1 border px-2.5 py-1 font-display text-sm font-bold ${claimed ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : mission.rewardType === "EVENT_POINTS" ? "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-200" : "border-amber-500/50 bg-amber-500/10 text-amber-200"}`}>
          +{mission.rewardNexus}
          {mission.rewardType === "EVENT_POINTS" ? <FragmentIcon className="h-4 w-4" /> : null}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="relative h-3 flex-1 overflow-hidden border border-cyan-900/60 bg-black/60">
          <div className={`absolute inset-y-0 left-0 ${claimed ? "bg-emerald-500" : "bg-gradient-to-r from-cyan-500 to-cyan-300"}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="min-w-[3.25rem] shrink-0 whitespace-nowrap text-right font-display text-sm font-bold tabular-nums text-slate-200">{Math.min(mission.progress, mission.targetCount)}/{mission.targetCount}</span>
      </div>
      <div className="mt-3">
        {claimed ? (
          <p className="text-center font-display text-sm font-bold uppercase tracking-[0.16em] text-emerald-400">Reclamada ✓</p>
        ) : (
          <button
            type="button"
            disabled={!canClaim || busy}
            className="h-10 w-full font-display text-sm font-bold uppercase tracking-[0.16em] transition disabled:bg-slate-800 disabled:text-slate-600 enabled:bg-amber-400 enabled:text-slate-950 enabled:hover:bg-amber-300"
            style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
            onClick={handleClaim}
          >
            {busy ? "Reclamando…" : canClaim ? "Reclamar recompensa" : "En progreso"}
          </button>
        )}
        {error ? <p className="mt-1.5 text-center text-xs text-rose-300">No se pudo reclamar.</p> : null}
      </div>
    </div>
  );
}

function GroupHeader({ title, countdown, note }: { title: string; countdown?: string; note?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">{title}</h3>
      {countdown ? (
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          Nuevas en <span className="font-display font-bold text-cyan-300">{countdown}</span>
        </span>
      ) : note ? (
        <span className="font-mono text-[11px] uppercase tracking-wider text-fuchsia-300/80">{note}</span>
      ) : null}
    </div>
  );
}

export function MissionsPanel({ missions, onClose }: IMissionsPanelProps) {
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const markClaimed = (missionId: string) => setClaimedIds((prev) => new Set(prev).add(missionId));

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const daily = missions.filter((mission) => mission.scope === "DAILY");
  const weekly = missions.filter((mission) => mission.scope === "WEEKLY");
  const event = missions.filter((mission) => mission.scope === "EVENT");
  const dailyCountdown = formatResetCountdown(msUntilDailyReset(nowMs));
  const weeklyCountdown = formatResetCountdown(msUntilWeeklyReset(nowMs));

  const renderGroup = (title: string, list: IMissionView[], options: { countdown?: string; note?: string }) =>
    list.length > 0 ? (
      <div className="space-y-2.5">
        <GroupHeader title={title} countdown={options.countdown} note={options.note} />
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
        <p className="py-6 text-center text-sm text-slate-400">No hay misiones disponibles.</p>
      ) : (
        <div className="space-y-5">
          {renderGroup("Evento", event, { note: "Una sola vez" })}
          {renderGroup("Diarias", daily, { countdown: dailyCountdown })}
          {renderGroup("Semanales", weekly, { countdown: weeklyCountdown })}
        </div>
      )}
    </ProgressionDialogShell>
  );
}
