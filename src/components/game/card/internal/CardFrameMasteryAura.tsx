// src/components/game/card/internal/CardFrameMasteryAura.tsx - Aura mastery V5 con fuego en bordes sin efectos de hidratación.
"use client";

import { motion } from "framer-motion";
import { CARD_CLIP_PATHS } from "./styles";

interface FlameConfig {
  id: number;
  isLeft: boolean;
  edgeOffset: number;
  delay: number;
  duration: number;
  width: number;
  height: number;
  targetScaleX: number;
}

interface CardFrameMasteryAuraProps {
  isActive: boolean;
}

export function CardFrameMasteryAura({ isActive }: CardFrameMasteryAuraProps) {
  const flames: FlameConfig[] = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    isLeft: i % 2 === 0,
    edgeOffset: ((i * 11) % 15) - 5,
    delay: ((i * 7) % 20) / 10,
    duration: 2 + ((i * 13) % 20) / 10,
    width: 15 + ((i * 17) % 20),
    height: 60 + ((i * 19) % 80),
    targetScaleX: 1.2 + ((i * 23) % 10) / 10,
  }));

  if (!isActive) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[50] mix-blend-screen">
      {/* 1. Anillo de Poder Dorado */}
      <motion.div
        className="absolute inset-0 border-[3px] border-amber-500"
        style={{ clipPath: CARD_CLIP_PATHS.outer, filter: "blur(4px)" }}
        animate={{
          borderColor: ["#f59e0b", "#fcd34d", "#f59e0b"],
          boxShadow: [
            "inset 0 0 20px rgba(245,158,11,0.6), 0 0 15px rgba(245,158,11,0.6)",
            "inset 0 0 40px rgba(252,211,77,0.8), 0 0 30px rgba(203,213,225,0.8)",
            "inset 0 0 20px rgba(245,158,11,0.6), 0 0 15px rgba(245,158,11,0.6)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 2. Llamas y Humo pre-calculadas */}
      {flames.map((flame) => (
        <motion.div
          key={flame.id}
          className={`absolute bottom-[10px] rounded-t-full bg-gradient-to-t from-amber-500 via-yellow-300 to-slate-400 blur-xl ${
            flame.isLeft ? "left-0" : "right-0"
          }`}
          style={{
            width: `${flame.width}px`,
            height: `${flame.height}px`,
            marginLeft: flame.isLeft ? `${flame.edgeOffset}px` : "auto",
            marginRight: !flame.isLeft ? `${flame.edgeOffset}px` : "auto",
          }}
          initial={{ y: 20, opacity: 0, scaleX: 0.8, scaleY: 0.8 }}
          animate={{
            y: -450,
            opacity: [0, 0.9, 0],
            scaleY: [0.8, 2, 3],
            scaleX: [null, flame.targetScaleX],
          }}
          transition={{
            duration: flame.duration,
            repeat: Infinity,
            delay: flame.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* 3. Base de Poder */}
      <motion.div
        className="absolute -bottom-4 left-0 right-0 h-4 bg-gradient-to-t from-amber-600 via-yellow-500/60 to-transparent blur-2xl"
        style={{ clipPath: CARD_CLIP_PATHS.outer }}
        animate={{ opacity: [0.5, 0.9, 0.5], scaleY: [0.9, 1.1, 0.9] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
