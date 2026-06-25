// src/components/hub/progression/DailyLoginModal.tsx - Modal cinemático de recompensa diaria: hero con la recompensa del día seleccionado (Card real si es carta), días clicables, racha y burst al reclamar.
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IDailyLoginClaimResult, ILoginRewardDay, ILoginStreakStatus } from "@/core/entities/progression/ILoginStreak";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { Card } from "@/components/game/card/Card";
import { track } from "@/services/analytics/client/analytics-buffer";

interface IDailyLoginModalProps {
  status: ILoginStreakStatus;
  onClose: () => void;
}

/** Glow radial estático (blur fijo) con pulso por transform/opacity. */
function HeroGlow({ tone }: { tone: "amber" | "cyan" | "emerald" }) {
  const gradient =
    tone === "emerald"
      ? "radial-gradient(circle,rgba(16,185,129,0.4),rgba(5,150,105,0.18),transparent 70%)"
      : tone === "amber"
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

/** Estallido one-shot al reclamar: destello + partículas radiales (solo transform/opacity). */
function ClaimBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <motion.div
        aria-hidden
        className="absolute h-32 w-32 rounded-full bg-cyan-300/40 blur-xl"
        initial={{ scale: 0.2, opacity: 0.85 }}
        animate={{ scale: 2.6, opacity: 0 }}
        transition={{ duration: 0.85, ease: "easeOut" }}
      />
      {Array.from({ length: 16 }).map((_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        return (
          <motion.span
            key={index}
            aria-hidden
            className="absolute h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(angle) * 130, y: Math.sin(angle) * 130, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.95, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export function DailyLoginModal({ status, onClose }: IDailyLoginModalProps) {
  const [claimedToday, setClaimedToday] = useState(status.claimedToday);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<IDailyLoginClaimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(status.pendingDayIndex);

  const claimedThrough = claimedToday ? status.pendingDayIndex : status.pendingDayIndex - 1;
  const currentStreak = result?.currentStreak ?? status.currentStreak;
  const burst = result?.applied === true;

  const selectedDay: ILoginRewardDay | undefined = status.calendar.find((day) => day.dayIndex === selectedDayIndex);
  const selectedCard = selectedDay?.rewardType === "CARD" && selectedDay.rewardCardId ? CARD_BY_ID.get(selectedDay.rewardCardId) : null;
  const isSelectedClaimed = selectedDayIndex <= claimedThrough;
  const heroTone: "amber" | "cyan" | "emerald" = isSelectedClaimed ? "emerald" : selectedCard ? "cyan" : "amber";
  const isViewingToday = selectedDayIndex === status.pendingDayIndex;

  async function handleClaim() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/progression/daily-login/claim", { method: "POST" });
      if (!response.ok) throw new Error("claim failed");
      const data = (await response.json()) as IDailyLoginClaimResult;
      setResult(data);
      setClaimedToday(true);
      setSelectedDayIndex(status.pendingDayIndex);
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

        <h2 className="text-center font-display text-xl font-bold uppercase tracking-[0.22em] text-cyan-100">Recompensa diaria</h2>

        <div className="mx-auto mt-2 flex w-fit items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-1.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-amber-400 stroke-none" aria-hidden><path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 5 2c1 4-2 5-2 8a4 4 0 1 1-8-1c0-4 4-5 3-10 2 0 3-2 3-5z" /></svg>
          <span className="font-display text-sm font-bold tracking-[0.1em] text-amber-200">{currentStreak} {currentStreak === 1 ? "DÍA SEGUIDO" : "DÍAS SEGUIDOS"}</span>
        </div>

        <motion.div animate={burst ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={{ duration: 0.5 }} className="relative my-4 flex h-[270px] items-center justify-center">
          <HeroGlow tone={heroTone} />
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedDayIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22 }}
              className="relative"
            >
              {selectedCard ? (
                <div className={`relative h-[263px] w-[180px] ${isSelectedClaimed ? "drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]" : "drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]"}`}>
                  <div style={{ width: 260, height: 380, transform: "scale(0.692)", transformOrigin: "top left" }}>
                    <Card card={selectedCard} disableHoverEffects disableHologram disableDefaultShadow />
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  <span className={`font-display text-6xl font-black ${isSelectedClaimed ? "text-emerald-200 drop-shadow-[0_0_24px_rgba(16,185,129,0.7)]" : "text-amber-200 drop-shadow-[0_0_24px_rgba(251,191,36,0.7)]"}`}>+{selectedDay?.rewardNexus ?? 0}</span>
                  <span className={`mt-1 font-display text-sm font-bold uppercase tracking-[0.3em] ${isSelectedClaimed ? "text-emerald-300/80" : "text-amber-300/80"}`}>Nexus</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {burst ? <ClaimBurst /> : null}
        </motion.div>

        <div className="text-center">
          <p className="font-display text-[11px] uppercase tracking-[0.3em] text-cyan-400/80">{isViewingToday ? "Tu recompensa de hoy" : "Vista previa"}</p>
          <p className="font-display text-lg font-bold uppercase tracking-[0.18em] text-cyan-100">Día {selectedDayIndex} <span className="text-slate-500">/ 7</span></p>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {status.calendar.map((day) => {
            const isClaimed = day.dayIndex <= claimedThrough;
            const isToday = !claimedToday && day.dayIndex === status.pendingDayIndex;
            const isSelected = day.dayIndex === selectedDayIndex;
            return (
              <button
                key={day.dayIndex}
                type="button"
                onClick={() => setSelectedDayIndex(day.dayIndex)}
                aria-label={`Día ${day.dayIndex}`}
                className="relative flex min-h-[46px] flex-col items-center justify-center gap-1 px-0.5 py-1.5 text-center transition-transform hover:scale-105"
              >
                <span className={`absolute inset-0 rounded-lg ${isClaimed ? "border border-emerald-600/60 bg-emerald-500/10" : isToday ? "bg-cyan-500/15" : "border border-slate-700 bg-slate-800/40"}`} />
                {isToday ? <motion.span aria-hidden className="absolute inset-0 rounded-lg border border-cyan-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.8, repeat: Infinity }} /> : null}
                {isSelected ? <span aria-hidden className="absolute inset-0 rounded-lg ring-2 ring-cyan-300" /> : null}
                <span className={`relative font-display text-[10px] tracking-wider ${isToday || isSelected ? "text-cyan-200" : "text-slate-400"}`}>D{day.dayIndex}</span>
                <span className={`relative font-display text-[11px] font-bold leading-none ${isClaimed ? "text-emerald-300" : isToday ? "text-cyan-100" : day.rewardType === "CARD" ? "text-fuchsia-300" : "text-slate-300"}`}>
                  {isClaimed ? "✓" : day.rewardType === "CARD" ? "★" : day.rewardNexus}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {result?.applied ? (
            <motion.p
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="mt-4 rounded-lg border border-emerald-500/50 bg-emerald-500/10 py-2.5 text-center font-display text-sm font-bold uppercase tracking-[0.08em] text-emerald-200"
            >
              ¡Recompensa obtenida! {result.rewardType === "CARD" ? "Carta especial añadida" : `+${result.rewardNexus} Nexus`}
            </motion.p>
          ) : null}
        </AnimatePresence>
        {error ? <p className="mt-3 text-center text-sm text-rose-300">{error}</p> : null}

        {claimedToday ? (
          <button type="button" className="mt-4 h-12 w-full rounded-xl bg-slate-700/80 font-display text-sm font-bold uppercase tracking-[0.14em] text-slate-200 transition hover:bg-slate-700" onClick={onClose}>
            {result?.applied ? "Continuar" : "Vuelve mañana"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 font-display text-sm font-bold uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.45)] transition hover:from-cyan-400 hover:to-sky-300 disabled:opacity-60"
            onClick={handleClaim}
          >
            {busy ? "Reclamando…" : "Reclamar recompensa"}
          </button>
        )}
      </motion.div>
    </div>
  );
}
