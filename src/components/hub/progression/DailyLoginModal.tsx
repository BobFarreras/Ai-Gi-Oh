// src/components/hub/progression/DailyLoginModal.tsx - Modal cinemático de recompensa diaria: hero con la recompensa de hoy (Card real si es carta), calendario de 7 días y racha.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IDailyLoginClaimResult, ILoginRewardDay, ILoginStreakStatus } from "@/core/entities/progression/ILoginStreak";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { Card } from "@/components/game/card/Card";
import { track } from "@/services/analytics/client/analytics-buffer";

interface IDailyLoginModalProps {
  status: ILoginStreakStatus;
  onClose: () => void;
}

/** Estrato de glow radial estático (sin animar blur) detrás del hero. */
function HeroGlow({ tone }: { tone: "amber" | "cyan" }) {
  const gradient =
    tone === "amber"
      ? "radial-gradient(circle,rgba(251,191,36,0.4),rgba(245,158,11,0.18),transparent 70%)"
      : "radial-gradient(circle,rgba(34,211,238,0.4),rgba(56,189,248,0.18),transparent 70%)";
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute h-72 w-72 rounded-full blur-2xl"
      style={{ background: gradient }}
      initial={{ opacity: 0.5, scale: 0.9 }}
      animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.9, 1.05, 0.9] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function DailyLoginModal({ status, onClose }: IDailyLoginModalProps) {
  const [claimedToday, setClaimedToday] = useState(status.claimedToday);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IDailyLoginClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const claimedThrough = claimedToday ? status.pendingDayIndex : status.pendingDayIndex - 1;
  const currentStreak = result?.currentStreak ?? status.currentStreak;
  const pendingDay: ILoginRewardDay | undefined = status.calendar.find((day) => day.dayIndex === status.pendingDayIndex);
  const pendingCard = pendingDay?.rewardType === "CARD" && pendingDay.rewardCardId ? CARD_BY_ID.get(pendingDay.rewardCardId) : null;
  const heroTone = pendingCard ? "cyan" : "amber";

  async function handleClaim() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/progression/daily-login/claim", { method: "POST" });
      if (!response.ok) throw new Error("claim failed");
      const data = (await response.json()) as IDailyLoginClaimResult;
      setResult(data);
      setClaimedToday(true);
      if (data.applied) track("daily_login_claimed", "system", { dayIndex: status.pendingDayIndex, currentStreak: data.currentStreak });
    } catch {
      setError("No se pudo reclamar. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Recompensa diaria" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        style={{ willChange: "transform" }}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-cyan-700/50 bg-gradient-to-b from-[#08141f] to-[#03090f] px-5 pb-5 pt-6 shadow-[0_0_60px_rgba(0,0,0,0.7)]"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600/70 text-slate-300 transition-colors hover:border-cyan-400 hover:text-cyan-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <h2 className="text-center text-xl font-black uppercase tracking-[0.16em] text-cyan-100">Recompensa diaria</h2>

        <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-amber-400 stroke-none" aria-hidden><path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 5 2c1 4-2 5-2 8a4 4 0 1 1-8-1c0-4 4-5 3-10 2 0 3-2 3-5z" /></svg>
          <span className="font-mono text-sm font-bold text-amber-200">{currentStreak} {currentStreak === 1 ? "día seguido" : "días seguidos"}</span>
        </div>

        <div className="relative my-4 flex h-[270px] items-center justify-center">
          <HeroGlow tone={heroTone} />
          {pendingCard ? (
            <div className="relative h-[263px] w-[180px] drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              <div style={{ width: 260, height: 380, transform: "scale(0.692)", transformOrigin: "top left" }}>
                <Card card={pendingCard} disableHoverEffects disableHologram disableDefaultShadow />
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col items-center">
              <span className="font-mono text-6xl font-black text-amber-200 drop-shadow-[0_0_24px_rgba(251,191,36,0.7)]">+{pendingDay?.rewardNexus ?? 0}</span>
              <span className="mt-1 font-mono text-sm font-bold uppercase tracking-[0.24em] text-amber-300/80">Nexus</span>
            </div>
          )}
        </div>
        <p className="text-center text-sm text-slate-300">
          Tu recompensa de <span className="font-bold text-cyan-200">hoy</span> · Día {status.pendingDayIndex} de 7
        </p>

        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {status.calendar.map((day) => {
            const isClaimed = day.dayIndex <= claimedThrough;
            const isToday = !claimedToday && day.dayIndex === status.pendingDayIndex;
            return (
              <div key={day.dayIndex} className="relative flex min-h-[44px] flex-col items-center justify-center gap-1 px-0.5 py-1.5 text-center">
                <span className={`absolute inset-0 rounded-lg ${isClaimed ? "border border-emerald-600/60 bg-emerald-500/10" : isToday ? "bg-cyan-500/15" : "border border-slate-700 bg-slate-800/40"}`} />
                {isToday ? (
                  <motion.span aria-hidden className="absolute inset-0 rounded-lg border border-cyan-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.8, repeat: Infinity }} />
                ) : null}
                <span className={`relative text-[10px] font-bold uppercase ${isToday ? "text-cyan-200" : "text-slate-400"}`}>D{day.dayIndex}</span>
                <span className={`relative text-[11px] font-black leading-none ${isClaimed ? "text-emerald-300" : isToday ? "text-cyan-100" : day.rewardType === "CARD" ? "text-fuchsia-300" : "text-slate-300"}`}>
                  {isClaimed ? "✓" : day.rewardType === "CARD" ? "★" : day.rewardNexus}
                </span>
              </div>
            );
          })}
        </div>

        {result?.applied ? (
          <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 rounded-lg border border-emerald-500/50 bg-emerald-500/10 py-2.5 text-center text-base font-black text-emerald-200">
            ¡Recompensa obtenida! {result.rewardType === "CARD" ? "Carta especial añadida" : `+${result.rewardNexus} Nexus`}
          </motion.p>
        ) : null}
        {error ? <p className="mt-3 text-center text-sm text-rose-300">{error}</p> : null}

        {claimedToday ? (
          <button type="button" className="mt-4 h-12 w-full rounded-xl bg-slate-700/80 text-base font-black uppercase tracking-[0.14em] text-slate-200 transition hover:bg-slate-700" onClick={onClose}>
            {result?.applied ? "Continuar" : "Vuelve mañana"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 text-base font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.45)] transition hover:from-cyan-400 hover:to-sky-300 disabled:opacity-60"
            onClick={handleClaim}
          >
            {busy ? "Reclamando…" : "Reclamar recompensa"}
          </button>
        )}
      </motion.div>
    </div>
  );
}
