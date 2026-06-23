// src/components/hub/progression/DailyLoginModal.tsx - Modal de recompensa de login diario con calendario de 7 días y claim.
"use client";

import { useState } from "react";
import { IDailyLoginClaimResult, ILoginStreakStatus } from "@/core/entities/progression/ILoginStreak";

interface IDailyLoginModalProps {
  status: ILoginStreakStatus;
  onClose: () => void;
}

export function DailyLoginModal({ status, onClose }: IDailyLoginModalProps) {
  const [claimedToday, setClaimedToday] = useState(status.claimedToday);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IDailyLoginClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Días anteriores del ciclo ya reclamados (para pintar la barra de progreso).
  const claimedThrough = claimedToday ? status.pendingDayIndex : status.pendingDayIndex - 1;

  async function handleClaim() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/progression/daily-login/claim", { method: "POST" });
      if (!response.ok) throw new Error("claim failed");
      const data = (await response.json()) as IDailyLoginClaimResult;
      setResult(data);
      setClaimedToday(true);
    } catch {
      setError("No se pudo reclamar. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Recompensa diaria">
      <div className="w-full max-w-lg rounded-2xl border border-cyan-800/60 bg-slate-900 p-5 shadow-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-black uppercase tracking-widest text-cyan-100">Recompensa diaria</h2>
          <button type="button" aria-label="Cerrar" className="h-7 w-7 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800" onClick={onClose}>✕</button>
        </div>
        <p className="mb-4 text-xs text-slate-400">
          Racha actual: <span className="font-bold text-cyan-300">{result?.currentStreak ?? status.currentStreak} día(s)</span> · Mejor racha: {status.longestStreak}
        </p>

        <div className="mb-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {status.calendar.map((day) => {
            const isClaimed = day.dayIndex <= claimedThrough;
            const isToday = !claimedToday && day.dayIndex === status.pendingDayIndex;
            return (
              <div
                key={day.dayIndex}
                className={[
                  "flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-center",
                  isClaimed ? "border-emerald-600/60 bg-emerald-500/10" : isToday ? "border-cyan-400 bg-cyan-500/15 ring-1 ring-cyan-400" : "border-slate-700 bg-slate-800/50",
                ].join(" ")}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">D{day.dayIndex}</span>
                <span className={`text-xs font-black ${isClaimed ? "text-emerald-300" : isToday ? "text-cyan-200" : "text-slate-300"}`}>
                  {day.rewardType === "CARD" ? "Carta" : `+${day.rewardNexus}`}
                </span>
                {isClaimed ? <span className="text-[9px] text-emerald-400">✓</span> : null}
              </div>
            );
          })}
        </div>

        {result?.applied ? (
          <p className="mb-3 rounded-lg border border-emerald-600/50 bg-emerald-500/10 py-2 text-center text-sm font-bold text-emerald-200">
            ¡Recompensa obtenida! {result.rewardType === "CARD" ? "Carta especial añadida" : `+${result.rewardNexus} Nexus`}
          </p>
        ) : null}
        {error ? <p className="mb-3 text-center text-xs text-rose-300">{error}</p> : null}

        {claimedToday ? (
          <button type="button" className="h-11 w-full rounded-xl bg-slate-700 text-sm font-black uppercase tracking-wider text-slate-200" onClick={onClose}>
            {result?.applied ? "Continuar" : "Ya reclamado hoy"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className="h-11 w-full rounded-xl bg-cyan-500 text-sm font-black uppercase tracking-wider text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            onClick={handleClaim}
          >
            {busy ? "Reclamando…" : "Reclamar recompensa"}
          </button>
        )}
      </div>
    </div>
  );
}
