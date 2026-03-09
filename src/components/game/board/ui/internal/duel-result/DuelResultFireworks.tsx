// src/components/game/board/ui/internal/duel-result/DuelResultFireworks.tsx - Efecto visual de fuegos artificiales para victorias en el overlay de resultado.
"use client";

import { motion } from "framer-motion";

interface DuelResultFireworksProps {
  isVisible: boolean;
}

const BURSTS = [
  { left: "12%", top: "20%", delay: 0.05, color: "bg-cyan-300/70" },
  { left: "24%", top: "12%", delay: 0.2, color: "bg-fuchsia-300/70" },
  { left: "38%", top: "24%", delay: 0.34, color: "bg-amber-300/70" },
  { left: "62%", top: "16%", delay: 0.48, color: "bg-emerald-300/70" },
  { left: "74%", top: "28%", delay: 0.62, color: "bg-sky-300/70" },
  { left: "86%", top: "18%", delay: 0.78, color: "bg-violet-300/70" },
];

export function DuelResultFireworks({ isVisible }: DuelResultFireworksProps) {
  if (!isVisible) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {BURSTS.map((burst) => (
        <motion.span
          key={`${burst.left}-${burst.top}`}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 0.95, 0], scale: [0.2, 1.35, 1.7] }}
          transition={{ duration: 1.05, delay: burst.delay, ease: "easeOut" }}
          className={`absolute h-24 w-24 rounded-full blur-[1px] ${burst.color}`}
          style={{ left: burst.left, top: burst.top }}
        />
      ))}
    </div>
  );
}

