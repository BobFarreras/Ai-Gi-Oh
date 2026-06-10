// src/components/auth/internal/useAuthFormSfx.ts - Gestiona efectos de sonido de formulario de autenticación con creación lazy de instancias Audio.
"use client";

import { useCallback } from "react";
import { getAudio } from "@/lib/audio-pool";

function safePlay(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.currentTime = 0;
  const maybePromise = audio.play();
  if (maybePromise && typeof maybePromise.catch === "function") {
    void maybePromise.catch(() => undefined);
  }
}

export function useAuthFormSfx() {
  const playButtonClick = useCallback(() => {
    safePlay(getAudio("/audio/landing/button-click.m4a", 0.2));
  }, []);

  const playFormEntry = useCallback(() => {
    safePlay(getAudio("/audio/landing/formulario.m4a", 0.42));
  }, []);

  return { playButtonClick, playFormEntry };
}