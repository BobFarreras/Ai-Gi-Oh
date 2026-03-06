// src/components/auth/internal/useAuthFormSfx.ts - Provee SFX para entrada de formulario y clics en acciones de autenticación.
"use client";

import { useCallback, useEffect, useRef } from "react";

function replay(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.currentTime = 0;
  const maybePromise = audio.play();
  if (maybePromise && typeof maybePromise.catch === "function") {
    void maybePromise.catch(() => undefined);
  }
}

export function useAuthFormSfx() {
  const buttonRef = useRef<HTMLAudioElement | null>(null);
  const formIntroRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    buttonRef.current = new Audio("/audio/landing/button-click.mp3");
    buttonRef.current.volume = 0.26;
    formIntroRef.current = new Audio("/audio/landing/formulario.mp3");
    formIntroRef.current.volume = 0.34;
  }, []);

  const playButtonClick = useCallback(() => replay(buttonRef.current), []);
  const playFormEntry = useCallback(() => replay(formIntroRef.current), []);

  return { playButtonClick, playFormEntry };
}
