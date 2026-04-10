// src/components/game/board/battlefield/internal/ChargeCastSfx.tsx - Reproduce sonido de carga al iniciar efectos con preparación.
"use client";

import { useEffect } from "react";
import { createAudioFromPath, safePlay } from "@/components/game/board/hooks/internal/audio/audioRuntime";

interface IChargeCastSfxProps {
  enabled: boolean;
  playKey?: string;
  path?: string;
  fallbackPath?: string;
  volume?: number;
}

const lastPlayedByKey = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1800;

/** Dispara audio corto de carga al montar un efecto visual. */
export function ChargeCastSfx({
  enabled,
  playKey,
  path = "/audio/sfx/effects/execution/cargar.mp3",
  fallbackPath = "/audio/sfx/cargar.mp3",
  volume = 0.76,
}: IChargeCastSfxProps) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || typeof window.Audio === "undefined") return;
    if (playKey) {
      const now = Date.now();
      const lastPlayedAt = lastPlayedByKey.get(playKey) ?? 0;
      if (now - lastPlayedAt < DEDUPE_WINDOW_MS) return;
      lastPlayedByKey.set(playKey, now);
    }
    const normalizedVolume = Math.max(0, Math.min(1, volume));
    const primaryAudio = createAudioFromPath(path, normalizedVolume);
    if (primaryAudio) {
      primaryAudio.onerror = () => {
        if (!fallbackPath) return;
        safePlay(createAudioFromPath(fallbackPath, normalizedVolume));
      };
      safePlay(primaryAudio);
    }
    return;
  }, [enabled, fallbackPath, path, playKey, volume]);
  return null;
}
