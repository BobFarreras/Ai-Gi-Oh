// src/components/hub/story/internal/scene/audio/use-story-map-soundtrack.ts - Reproduce música continua del mapa Story por acto activo.
"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { resolveStoryActSoundtrackUrl } from "@/services/story/resolve-story-act-soundtrack-url";

const STORY_AUDIO_UNLOCK_EVENTS: Array<keyof WindowEventMap> = ["pointerdown", "keydown", "touchstart"];
const STORY_MUTED_STORAGE_KEY = "story-map-muted";
const STORY_MUTED_CHANGE_EVENT = "story-map-muted-change";

function readStoryMutedFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORY_MUTED_STORAGE_KEY) === "1";
}

function subscribeStoryMuted(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handleStorage = (event: StorageEvent): void => {
    if (event.key && event.key !== STORY_MUTED_STORAGE_KEY) return;
    onStoreChange();
  };
  const handleLocalChange = (): void => {
    onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener(STORY_MUTED_CHANGE_EVENT, handleLocalChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STORY_MUTED_CHANGE_EVENT, handleLocalChange);
  };
}

/**
 * Mantiene un único soundtrack de fondo para todo el mapa del acto, independiente de diálogos/eventos.
 */
export function useStoryMapSoundtrack(activeActId: number): { isMuted: boolean; toggleMute: () => void } {
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const isMutedRef = useRef(false);
  const isMuted = useSyncExternalStore(subscribeStoryMuted, readStoryMutedFromStorage, () => false);

  const toggleMute = (): void => {
    if (typeof window === "undefined") return;
    const next = !readStoryMutedFromStorage();
    window.localStorage.setItem(STORY_MUTED_STORAGE_KEY, next ? "1" : "0");
    window.dispatchEvent(new Event(STORY_MUTED_CHANGE_EVENT));
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
