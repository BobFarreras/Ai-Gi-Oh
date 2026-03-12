// src/components/hub/story/internal/scene/audio/use-story-scene-sfx.ts - Gestiona SFX locales de interacción del modo Story.
"use client";

import { useEffect, useRef } from "react";

interface IStorySceneSfxMap {
  NODE_SELECT: string;
  BUTTON_CLICK: string;
  MOVE: string;
  REWARD_NEXUS: string;
  REWARD_CARD: string;
  DUEL_START: string;
}

const STORY_SCENE_SFX_PATHS: IStorySceneSfxMap = {
  NODE_SELECT: "/audio/hub/arsenal/añadir.mp3",
  BUTTON_CLICK: "/audio/landing/button-click.mp3",
  MOVE: "/audio/story/effects/movimento.mp3",
  REWARD_NEXUS: "/audio/story/effects/moneda.mp3",
  REWARD_CARD: "/audio/story/effects/obtener-carta.mp3",
  DUEL_START: "/audio/landing/formulario.mp3",
};

function safeReplay(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.currentTime = 0;
  const maybePromise = audio.play();
  if (maybePromise && typeof maybePromise.catch === "function") {
    maybePromise.catch(() => undefined);
  }
}

/**
 * Precarga y reproduce efectos de sonido Story sin acoplar UI a rutas de audio.
 */
export function useStorySceneSfx() {
  const audioByIdRef = useRef<Partial<Record<keyof IStorySceneSfxMap, HTMLAudioElement>>>({});

  useEffect(() => {
    const entries = Object.entries(STORY_SCENE_SFX_PATHS) as Array<
      [keyof IStorySceneSfxMap, string]
    >;
    for (const [id, path] of entries) {
      const audio = new Audio(path);
      audio.preload = "auto";
      audio.volume = id === "REWARD_NEXUS" || id === "REWARD_CARD" ? 0.5 : 0.4;
      audioByIdRef.current[id] = audio;
    }
    // Compatibilidad con typo histórico del nombre de archivo de movimiento.
    const movementAudio = audioByIdRef.current.MOVE;
    if (movementAudio) {
      movementAudio.onerror = () => {
        movementAudio.src = "/audio/story/effects/movimiento.mp3";
      };
    }
    return () => {
      for (const id of Object.keys(audioByIdRef.current) as Array<keyof IStorySceneSfxMap>) {
        const audio = audioByIdRef.current[id];
        if (!audio) continue;
        audio.pause();
        audio.currentTime = 0;
      }
      audioByIdRef.current = {};
    };
  }, []);

  return {
    playNodeSelect: () => safeReplay(audioByIdRef.current.NODE_SELECT ?? null),
    playButtonClick: () => safeReplay(audioByIdRef.current.BUTTON_CLICK ?? null),
    playMove: () => safeReplay(audioByIdRef.current.MOVE ?? null),
    playRewardNexus: () => safeReplay(audioByIdRef.current.REWARD_NEXUS ?? null),
    playRewardCard: () => safeReplay(audioByIdRef.current.REWARD_CARD ?? null),
    playDuelStart: () => safeReplay(audioByIdRef.current.DUEL_START ?? null),
  };
}
