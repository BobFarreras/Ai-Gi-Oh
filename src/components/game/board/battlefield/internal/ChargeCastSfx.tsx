// src/components/game/board/battlefield/internal/ChargeCastSfx.tsx - Reproduce sonido de carga al iniciar efectos con preparación.
"use client";

import { useEffect } from "react";

interface IChargeCastSfxProps {
  enabled: boolean;
  path?: string;
  volume?: number;
}

/** Dispara audio corto de carga al montar un efecto visual. */
export function ChargeCastSfx({ enabled, path = "/audio/sfx/cargar.mp3", volume = 0.76 }: IChargeCastSfxProps) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof window.Audio === "undefined") return;
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.loop = false;
    audio.volume = Math.max(0, Math.min(1, volume));
    const result = audio.play();
    if (result && typeof result.catch === "function") result.catch(() => undefined);
    return () => {
      audio.pause();
    };
  }, [enabled, path, volume]);
  return null;
}
