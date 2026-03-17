// src/components/hub/story/internal/map/components/StoryRewardFloatingText.tsx - Texto flotante de recompensa sobre el avatar durante recolección.
"use client";

import { motion } from "framer-motion";

interface IStoryRewardFloatingTextProps {
  isVisible: boolean;
  label: string;
  at: { x: number; y: number };
  tone?: "NEXUS" | "CARD";
}

/**
 * Muestra feedback inmediato de recompensa sin bloquear interacción del mapa.
 */
export function StoryRewardFloatingText({
  isVisible,
  label,
  at,
  tone = "NEXUS",
}: IStoryRewardFloatingTextProps) {
  if (!isVisible) return null;
  const palette =
    tone === "CARD"
      ? "border-fuchsia-400/60 text-fuchsia-200 shadow-[0_0_14px_rgba(217,70,239,0.55)]"
      : "border-emerald-400/60 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.55)]";
  return (
    <motion.div
      className={`pointer-events-none absolute z-50 -translate-x-1/2 rounded border bg-black/80 px-2 py-1 text-[11px] font-black uppercase tracking-widest ${palette}`}
      initial={{ left: at.x, top: at.y - 20, opacity: 0, scale: 0.9 }}
      animate={{ left: at.x, top: at.y - 78, opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.58, ease: "easeOut" }}
    >
      {label}
    </motion.div>
  );
}
