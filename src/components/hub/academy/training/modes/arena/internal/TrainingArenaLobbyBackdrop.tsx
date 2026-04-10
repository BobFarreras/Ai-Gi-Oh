// src/components/hub/academy/training/modes/arena/internal/TrainingArenaLobbyBackdrop.tsx - Fondo animado reutilizable para la pantalla previa de arena.
"use client";
import { motion } from "framer-motion";

const ORBS = [
  { className: "left-[8%] top-[16%] h-44 w-44 bg-cyan-500/15", x: [0, 20, 0], y: [0, -16, 0], duration: 11 },
  { className: "right-[10%] top-[24%] h-56 w-56 bg-fuchsia-500/10", x: [0, -24, 0], y: [0, 18, 0], duration: 13 },
  { className: "left-[24%] bottom-[12%] h-40 w-40 bg-emerald-400/10", x: [0, 14, 0], y: [0, 14, 0], duration: 9 },
];

/**
 * Aporta profundidad visual sin impactar la interacción del lobby.
 */
export function TrainingArenaLobbyBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(16,185,129,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(3,15,29,0.96)_0%,rgba(5,23,44,0.92)_42%,rgba(32,9,22,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.06)_1px,transparent_1px)] bg-[size:22px_22px] opacity-35" />
      <div className="absolute inset-y-0 left-1/2 w-[1px] -translate-x-1/2 bg-cyan-300/20 blur-[1px]" />
      {ORBS.map((orb) => (
        <motion.span
          key={orb.className}
          className={`absolute rounded-full blur-3xl ${orb.className}`}
          animate={{ x: orb.x, y: orb.y }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: orb.duration, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
