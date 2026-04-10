// src/components/hub/story/internal/scene/audio/use-story-map-soundtrack.ts - Reproduce música continua del mapa Story por acto activo.
"use client";

import { useEffect, useRef, useState } from "react";
import { resolveStoryActSoundtrackUrl } from "@/services/story/resolve-story-act-soundtrack-url";

const STORY_AUDIO_UNLOCK_EVENTS: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
const STORY_MUTED_STORAGE_KEY = "story-map-muted";

/**
 * Mantiene un único soundtrack de fondo para todo el mapa del acto, independiente de diálogos/eventos.
 */
export function useStoryMapSoundtrack(activeActId: number): { isMuted: boolean; toggleMute: () => void } {
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORY_MUTED_STORAGE_KEY) === "1";
  });

  const toggleMute = (): void => {
    setIsMuted((previous) => {
      const next = !previous;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORY_MUTED_STORAGE_KEY, next ? "1" : "0");
      }
      return next;
    });
  };

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (typeof Audio === "undefined") return;
    const soundtrack = new Audio(resolveStoryActSoundtrackUrl(activeActId));
    soundtrack.preload = "auto";
    soundtrack.loop = true;
    soundtrack.volume = 0.34;
    soundtrackRef.current = soundtrack;
    let isDisposed = false;
    let isUnlocked = false;

    const detachUnlockListeners = (): void => {
      for (const eventName of STORY_AUDIO_UNLOCK_EVENTS) {
        window.removeEventListener(eventName, handleUserUnlock);
      }
    };

    const handleUserUnlock = (): void => {
      if (isDisposed || isUnlocked) return;
      if (isMutedRef.current) return;
      void soundtrack.play()
        .then(() => {
          isUnlocked = true;
          detachUnlockListeners();
        })
        .catch(() => undefined);
    };

    if (!isMutedRef.current) {
      void soundtrack.play()
        .then(() => {
          isUnlocked = true;
        })
        .catch(() => {
          for (const eventName of STORY_AUDIO_UNLOCK_EVENTS) {
            window.addEventListener(eventName, handleUserUnlock, { passive: true });
          }
        });
    }

    return () => {
      isDisposed = true;
      detachUnlockListeners();
      soundtrack.pause();
      soundtrack.currentTime = 0;
      if (soundtrackRef.current === soundtrack) {
        soundtrackRef.current = null;
      }
    };
  }, [activeActId]);

  useEffect(() => {
    const soundtrack = soundtrackRef.current;
    if (!soundtrack) return;
    if (isMuted) {
      soundtrack.pause();
      return;
    }
    void soundtrack.play().catch(() => undefined);
  }, [isMuted]);

  return { isMuted, toggleMute };
}
