// src/components/hub/internal/use-hub-sfx.ts - Gestiona efectos de sonido del hub con creación lazy de instancias Audio.
"use client";

import { useCallback, useRef } from "react";
import { getAudio } from "@/lib/audio-pool";

interface IHubSfxControls {
  playNodeHover: () => void;
  playHudEntry: () => void;
  playUiClick: () => void;
}

function safeReplay(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.currentTime = 0;
  const maybePromise = audio.play();
  if (maybePromise && typeof maybePromise.catch === "function") {
    void maybePromise.catch(() => undefined);
  }
}

export function useHubSfx(): IHubSfxControls {
  const lastHoverAtRef = useRef(0);

  const playNodeHover = useCallback(() => {
    const now = performance.now();
    if (now - lastHoverAtRef.current < 120) return;
    lastHoverAtRef.current = now;
    safeReplay(getAudio("/audio/landing/button-click.m4a", 0.12));
  }, []);

  const playHudEntry = useCallback(() => {
    safeReplay(getAudio("/audio/landing/formulario.m4a", 0.32));
  }, []);

  const playUiClick = useCallback(() => {
    safeReplay(getAudio("/audio/landing/button-click.m4a", 0.22));
  }, []);

  return { playNodeHover, playHudEntry, playUiClick };
}