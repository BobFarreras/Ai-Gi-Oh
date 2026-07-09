// src/components/hub/story/overworld/hud/OverworldCardPickup.tsx - Revelado de carta al recogerla en el overworld: muestra la Card real y luego se encoge hacia el jugador.
"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";

interface OverworldCardPickupProps {
  card: ICard;
  /** Se llama al terminar la animación (o por el failsafe): la escena reanuda el control. */
  onComplete: () => void;
}

// Duración total del revelado en segundos y los puntos clave de la línea de tiempo (aparece → se
// mantiene legible → se encoge y cae hacia el jugador). Se centraliza para que el failsafe coincida.
const REVEAL_SECONDS = 2.4;
const REVEAL_KEYFRAMES = [0, 0.22, 0.72, 1] as const;

/**
 * Presenta la carta recién obtenida a tamaño de lectura y la anima encogiéndose hacia abajo (hacia
 * el jugador), como "guardarla". El mundo queda congelado por la escena mientras dura. Incluye un
 * failsafe por si `onAnimationComplete` no dispara (p. ej. pestaña en segundo plano).
 */
export function OverworldCardPickup({ card, onComplete }: OverworldCardPickupProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, REVEAL_SECONDS * 1000 + 300);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        className="drop-shadow-[0_25px_60px_rgba(0,0,0,0.9)]"
        style={{ transformOrigin: "center" }}
        initial={{ scale: 0.35, opacity: 0, y: 40, rotateZ: -6 }}
        animate={{
          scale: [0.35, 1, 1, 0.1],
          opacity: [0, 1, 1, 0],
          y: [40, 0, 0, 260],
          rotateZ: [-6, 0, 0, 4],
        }}
        transition={{ duration: REVEAL_SECONDS, times: [...REVEAL_KEYFRAMES], ease: "easeInOut" }}
        onAnimationComplete={onComplete}
      >
        <Card card={card} disableHoverEffects prioritizeMediaLoading />
      </motion.div>
    </div>
  );
}
