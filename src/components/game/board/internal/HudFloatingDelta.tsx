// src/components/game/board/internal/HudFloatingDelta.tsx - Delta flotante anclado al área LP para feedback claro y legible.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HudFloatingDeltaProps {
  value: number | null;
  sign: "+" | "-";
  isOpponent: boolean;
  color: "red" | "green" | "yellow" | "purple";
  pulseKey?: string | null;
  anchor?: "HEALTH" | "ENERGY";
}

function resolveToneClass(color: HudFloatingDeltaProps["color"]): string {
  if (color === "red") return "drop-shadow-[0_0_20px_rgba(239,68,68,1)] text-red-500";
  if (color === "yellow") return "drop-shadow-[0_0_20px_rgba(250,204,21,1)] text-yellow-400";
  if (color === "purple") return "drop-shadow-[0_0_20px_rgba(168,85,247,1)] text-violet-400";
  return "drop-shadow-[0_0_20px_rgba(16,185,129,1)] text-emerald-400";
}

function resolveAnchorClass(isOpponent: boolean, anchor: "HEALTH" | "ENERGY"): string {
  const vertical = anchor === "HEALTH" ? "top-3" : "top-12";
  return isOpponent ? `left-[5.2rem] ${vertical}` : `right-[5.2rem] ${vertical}`;
}

export function HudFloatingDelta({ value, sign, isOpponent, color, pulseKey = null, anchor = "HEALTH" }: HudFloatingDeltaProps) {
  if (value === null) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={pulseKey ?? `${color}-${sign}-${value}`}
        initial={{ opacity: 0, y: 6, scale: 0.74 }}
        animate={{ opacity: [0, 1, 0.96, 0], y: [6, -16, -48, -88], scale: [0.74, 1.44, 1.36, 1.1] }}
        exit={{ opacity: 0, scale: 1 }}
        transition={{ duration: 2.05, ease: "easeOut" }}
        className={cn(
          "absolute z-[200] font-black text-6xl leading-none",
          resolveToneClass(color),
          resolveAnchorClass(isOpponent, anchor),
        )}
      >
        {sign}
        {value}
      </motion.div>
    </AnimatePresence>
  );
}
