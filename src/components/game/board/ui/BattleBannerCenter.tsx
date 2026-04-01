// src/components/game/board/ui/BattleBannerCenter.tsx - Banner central de eventos críticos del combate y estado visual del modo automático.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IBattleBannerMessage, resolveLatestBannerMessage } from "./internal/banner/banner-message-policy";

interface BattleBannerCenterProps {
  events: ICombatLogEvent[];
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  externalBannerSignal?: IBattleBannerMessage | null;
}

const DISPLAY_MS = 3000;
const DISPLAY_HERO_MS = 3600;
export function BattleBannerCenter({
  events,
  playerAId,
  playerAName,
  playerBId,
  playerBName,
  externalBannerSignal = null,
}: BattleBannerCenterProps) {
  const [activeMessage, setActiveMessage] = useState<IBattleBannerMessage | null>(null);
  const processedCountRef = useRef(0);
  const processedExternalIdRef = useRef<string | null>(null);
  const labels = useMemo(() => ({ playerAId, playerAName, playerBId, playerBName }), [playerAId, playerAName, playerBId, playerBName]);
  const variant = activeMessage?.variant ?? (activeMessage?.id.startsWith("auto-mode-") ? "AUTO" : "DEFAULT");
  const isVictory = variant === "VICTORY";
  const isDefeat = variant === "DEFEAT";
  const isTurnLimit = variant === "TURN_LIMIT";
  const isAutoModeMessage = variant === "AUTO";
  const leftPanelClass = isVictory
    ? "border-amber-300/75 bg-amber-500/18 shadow-[0_0_52px_rgba(251,191,36,0.6)]"
    : isDefeat
      ? "border-rose-300/70 bg-rose-500/18 shadow-[0_0_48px_rgba(225,29,72,0.55)]"
      : isTurnLimit
        ? "border-violet-300/70 bg-violet-500/18 shadow-[0_0_45px_rgba(167,139,250,0.52)]"
        : isAutoModeMessage
          ? "border-violet-300/70 bg-violet-500/18 shadow-[0_0_45px_rgba(167,139,250,0.55)]"
          : "border-cyan-300/60 bg-cyan-500/15 shadow-[0_0_45px_rgba(6,182,212,0.45)]";
  const rightPanelClass = isVictory
    ? "border-amber-300/75 bg-amber-500/16 shadow-[0_0_52px_rgba(251,191,36,0.58)]"
    : isDefeat
      ? "border-red-300/75 bg-red-500/20 shadow-[0_0_52px_rgba(239,68,68,0.62)]"
      : isTurnLimit
        ? "border-violet-300/70 bg-violet-500/18 shadow-[0_0_45px_rgba(167,139,250,0.52)]"
        : isAutoModeMessage
          ? "border-violet-300/70 bg-violet-500/18 shadow-[0_0_45px_rgba(167,139,250,0.55)]"
          : "border-red-300/60 bg-red-500/15 shadow-[0_0_45px_rgba(239,68,68,0.45)]";
  const leftTextClass = isVictory
    ? "text-amber-100"
    : isDefeat
      ? "text-rose-100"
      : isTurnLimit || isAutoModeMessage
        ? "text-violet-100"
        : "text-cyan-100";
  const rightTextClass = isVictory
    ? "text-amber-100"
    : isDefeat
      ? "text-red-100"
      : isTurnLimit || isAutoModeMessage
        ? "text-violet-100"
        : "text-red-100";

  useEffect(() => {
    const nextEvents = events.slice(processedCountRef.current);
    processedCountRef.current = events.length;
    const nextExternalSignal =
      externalBannerSignal && processedExternalIdRef.current !== externalBannerSignal.id ? externalBannerSignal : null;
    if (nextExternalSignal) processedExternalIdRef.current = nextExternalSignal.id;
    const latest = resolveLatestBannerMessage({ events: nextEvents, labels, externalBannerSignal: nextExternalSignal });
    if (!latest) return;
    setActiveMessage(latest);
  }, [events, externalBannerSignal, labels]);

  useEffect(() => {
    if (!activeMessage) {
      return;
    }
    const duration = activeMessage.variant === "VICTORY" || activeMessage.variant === "DEFEAT" ? DISPLAY_HERO_MS : DISPLAY_MS;
    const timeoutId = setTimeout(() => setActiveMessage((current) => (current?.id === activeMessage.id ? null : current)), duration);
    return () => clearTimeout(timeoutId);
  }, [activeMessage]);

  if (!activeMessage) {
    return null;
  }

  return (
    <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[145] pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMessage.id}
          initial={{ opacity: 0, scale: 0.7, y: isVictory ? 24 : 0 }}
          animate={{ opacity: 1, scale: isVictory ? [1, 1.03, 1] : 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.12 }}
          className="flex items-center gap-3"
        >
          <motion.div
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className={`px-8 py-5 rounded-l-2xl border ${leftPanelClass}`}
          >
            <p className={`text-2xl font-black uppercase tracking-wider ${leftTextClass}`}>{activeMessage.left}</p>
          </motion.div>
          <motion.div
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.07 }}
            className={`px-8 py-5 rounded-r-2xl border ${rightPanelClass}`}
          >
            <p className={`text-2xl font-black uppercase tracking-wider ${rightTextClass}`}>{activeMessage.right}</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
