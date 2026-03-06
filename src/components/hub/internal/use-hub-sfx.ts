// src/components/hub/internal/use-hub-sfx.ts - Gestiona efectos de sonido del hub para hover de nodos y entrada del HUD.
"use client";

import { useCallback, useEffect, useRef } from "react";

interface IHubSfxControls {
  playNodeHover: () => void;
  playHudEntry: () => void;
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
  const nodeHoverRef = useRef<HTMLAudioElement | null>(null);
  const hudEntryRef = useRef<HTMLAudioElement | null>(null);
  const lastHoverAtRef = useRef(0);

  useEffect(() => {
    nodeHoverRef.current = new Audio("/audio/landing/button-click.mp3");
    nodeHoverRef.current.volume = 0.12;
    hudEntryRef.current = new Audio("/audio/landing/formulario.mp3");
    hudEntryRef.current.volume = 0.32;
    return () => {
      if (nodeHoverRef.current) {
        nodeHoverRef.current.pause();
        nodeHoverRef.current.currentTime = 0;
      }
      if (hudEntryRef.current) {
        hudEntryRef.current.pause();
        hudEntryRef.current.currentTime = 0;
      }
    };
  }, []);

  const playNodeHover = useCallback(() => {
    const now = performance.now();
    if (now - lastHoverAtRef.current < 120) return;
    lastHoverAtRef.current = now;
    safeReplay(nodeHoverRef.current);
  }, []);

  const playHudEntry = useCallback(() => {
    safeReplay(hudEntryRef.current);
  }, []);

  return { playNodeHover, playHudEntry };
}
