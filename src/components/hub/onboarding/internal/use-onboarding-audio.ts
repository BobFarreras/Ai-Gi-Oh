// src/components/hub/onboarding/internal/use-onboarding-audio.ts - Hook para gestionar soundtrack y efectos del onboarding narrativo.
"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ONBOARDING_AUDIO_CATALOG } from "@/components/hub/onboarding/internal/onboarding-audio-catalog";

interface IUseOnboardingAudioInput {
  isEnabled: boolean;
}

function playSfx(path: string, volume: number): void {
  const audio = new Audio(path);
  audio.volume = volume;
  void audio.play().catch(() => undefined);
}

/**
 * Centraliza reproducción de audio del onboarding para evitar lógica duplicada en la vista.
 */
export function useOnboardingAudio({ isEnabled }: IUseOnboardingAudioInput) {
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      soundtrackRef.current?.pause();
      soundtrackRef.current = null;
      return;
    }
    const soundtrack = new Audio(ONBOARDING_AUDIO_CATALOG.soundtrack);
    soundtrack.loop = true;
    soundtrack.volume = 0.34;
    soundtrackRef.current = soundtrack;
    void soundtrack.play().catch(() => undefined);
    return () => {
      soundtrack.pause();
      soundtrack.currentTime = 0;
      soundtrackRef.current = null;
    };
  }, [isEnabled]);

  const playStepMovement = useCallback(() => playSfx(ONBOARDING_AUDIO_CATALOG.movement, 0.56), []);
  const playButtonClick = useCallback(() => playSfx(ONBOARDING_AUDIO_CATALOG.buttonClick, 0.62), []);
  return useMemo(() => ({ playStepMovement, playButtonClick }), [playButtonClick, playStepMovement]);
}
