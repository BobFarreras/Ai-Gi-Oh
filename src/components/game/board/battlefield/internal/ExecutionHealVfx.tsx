// src/components/game/board/battlefield/internal/ExecutionHealVfx.tsx - VFX de curación con humo verde desde carta hacia el HUD del propietario.
"use client";

import { motion } from "framer-motion";
import { ChargeCastSfx } from "@/components/game/board/battlefield/internal/ChargeCastSfx";

interface IExecutionHealVfxProps {
  isOpponentSide: boolean;
}

export function ExecutionHealVfx({ isOpponentSide }: IExecutionHealVfxProps) {
  const targetX = isOpponentSide ? 338 : -338;
  const targetY = isOpponentSide ? -282 : 282;
  const ringAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <div className="pointer-events-none absolute inset-0 z-[220]">
      <ChargeCastSfx enabled path="/audio/sfx/cargar.mp3" volume={0.7} />
      {ringAngles.map((angle, index) => {
        const radians = (angle * Math.PI) / 180;
        const radius = 42;
        const x = Math.cos(radians) * radius;
        const y = Math.sin(radians) * radius;
        return (
        <motion.div
          key={`heal-ring-smoke-${angle}`}
          initial={{ opacity: 0, y: 8, scale: 0.72 }}
          animate={{ opacity: [0, 0.9, 0], y: [8, -34, -62], scale: [0.72, 1.18, 1.44] }}
          transition={{ duration: 0.34 + index * 0.03, delay: index * 0.04, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 h-11 w-8 rounded-full bg-gradient-to-t from-emerald-500/80 via-emerald-300/78 to-cyan-100/52 blur-md"
          style={{ x, y }}
        />
      );
      })}
      <motion.div
        initial={{ opacity: 0, scale: 0.62, x: 0, y: 0 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.62, 1.02, 0.7], x: [0, targetX], y: [0, targetY] }}
        transition={{ duration: 1, delay: 0.22, ease: "easeInOut" }}
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(110,231,183,0.96)_0%,rgba(16,185,129,0.82)_45%,rgba(5,150,105,0.25)_82%)] shadow-[0_0_36px_rgba(16,185,129,0.95)]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.65 }}
        animate={{ opacity: [0, 1, 0], scale: [0.65, 1.42, 1.06] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.85)_0%,rgba(16,185,129,0.24)_42%,rgba(16,185,129,0)_82%)]"
      />
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: [-16, -52], opacity: [0, 1, 0] }}
        transition={{ duration: 1.18, ease: "easeOut" }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 text-5xl font-black text-emerald-100 drop-shadow-[0_0_24px_rgba(52,211,153,1)]"
      >
        HEAL
      </motion.div>
    </div>
  );
}
