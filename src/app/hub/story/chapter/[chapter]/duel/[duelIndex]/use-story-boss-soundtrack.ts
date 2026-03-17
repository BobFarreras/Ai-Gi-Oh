// src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/use-story-boss-soundtrack.ts - Reproduce soundtrack en loop para duelos BOSS sin acoplarse al motor de combate.
"use client";

import { useEffect, useState } from "react";

const BOSS_SOUNDTRACK_CANDIDATES = [
  "/audio/story/effects/boss-soundtrack.mp3",
];

/**
 * Activa música de BOSS en loop cuando el duelo está listo para jugar (sin overlays bloqueando inicio).
 */
export function useStoryBossSoundtrack(input: {
  isBossDuel: boolean;
  isBlockedByOverlay: boolean;
  isStopped: boolean;
}): void {
  const [isMuted, setIsMuted] = useState<boolean>(() => (
    typeof window !== "undefined" ? window.localStorage.getItem("board-muted") === "1" : false
  ));

  useEffect(() => {
    const syncMuted = () => setIsMuted(window.localStorage.getItem("board-muted") === "1");
    syncMuted();
    window.addEventListener("board-muted-changed", syncMuted as EventListener);
    window.addEventListener("storage", syncMuted);
    return () => {
      window.removeEventListener("board-muted-changed", syncMuted as EventListener);
      window.removeEventListener("storage", syncMuted);
    };
  }, []);

  useEffect(() => {
    if (!input.isBossDuel || input.isBlockedByOverlay || input.isStopped || isMuted) {
      return;
    }
    const audio = new Audio(BOSS_SOUNDTRACK_CANDIDATES[0]);
    audio.loop = true;
    audio.volume = 0.34;
    const retryWithFallback = () => {
      audio.pause();
    };
    audio.addEventListener("error", retryWithFallback);
    void audio.play().catch(() => undefined);
    return () => {
      audio.removeEventListener("error", retryWithFallback);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [input.isBlockedByOverlay, input.isBossDuel, input.isStopped, isMuted]);
}
