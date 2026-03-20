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
  externalBannerSignal?: { id: string; left: string; right: string } | null;
}

const DISPLAY_MS = 2200;
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
  const isAutoModeMessage = Boolean(activeMessage?.id.startsWith("auto-mode-"));

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
    const timeoutId = setTimeout(() => setActiveMessage((current) => (current?.id === activeMessage.id ? null : current)), DISPLAY_MS);
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
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.12 }}
          className="flex items-center gap-3"
        >
          <motion.div
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className={`px-8 py-5 rounded-l-2xl border ${isAutoModeMessage ? "border-violet-300/70 bg-violet-500/18 shadow-[0_0_45px_rgba(167,139,250,0.55)]" : "border-cyan-300/60 bg-cyan-500/15 shadow-[0_0_45px_rgba(6,182,212,0.45)]"}`}
          >
            <p className={`text-2xl font-black uppercase tracking-wider ${isAutoModeMessage ? "text-violet-100" : "text-cyan-100"}`}>{activeMessage.left}</p>
          </motion.div>
          <motion.div
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.07 }}
            className={`px-8 py-5 rounded-r-2xl border ${isAutoModeMessage ? "border-violet-300/70 bg-violet-500/18 shadow-[0_0_45px_rgba(167,139,250,0.55)]" : "border-red-300/60 bg-red-500/15 shadow-[0_0_45px_rgba(239,68,68,0.45)]"}`}
          >
            <p className={`text-2xl font-black uppercase tracking-wider ${isAutoModeMessage ? "text-violet-100" : "text-red-100"}`}>{activeMessage.right}</p>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
