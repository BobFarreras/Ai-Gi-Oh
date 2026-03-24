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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_52%),radial-gradient(circle_at_bottom,rgba(244,114,182,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(8,47,73,0.4)_48%,transparent_100%)] opacity-60" />
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
