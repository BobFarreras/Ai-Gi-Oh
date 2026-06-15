// src/components/landing/useLandingAudio.ts - Gestiona efectos de sonido y soundtrack de narración para la landing con creación lazy de instancias Audio.
"use client";

import { useCallback, useEffect, useRef } from "react";
import { getAudio, pauseAllAudio } from "@/lib/audio-pool";

interface IUseLandingAudioOptions {
  isNarrativeActive: boolean;
}

export interface ILandingAudioControls {
  playButtonClick: () => void;
  playTerminalBoot: () => void;
  playFormEntry: () => void;
  playHeroCardDeploy: (delayMs?: number) => void;
  stopNarrationTrack: () => void;
}

const PATHS = {
  buttonClick: "/audio/landing/button-click.m4a",
  terminalBoot: "/audio/landing/terminal.m4a",
  formEntry: "/audio/landing/formulario.m4a",
  heroDeploy: "/audio/landing/hero.m4a",
  narrationTrack: "/audio/landing/soundtrack.m4a",
} as const;

const VOLUMES = {
  buttonClick: 0.16,
  terminalBoot: 0.5,
  formEntry: 0.42,
  heroDeploy: 0.14,
  narrationTrack: 0.38,
} as const;

function safePlay(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.currentTime = 0;
  const maybePromise = audio.play();
  if (maybePromise && typeof maybePromise.catch === "function") {
    void maybePromise.catch(() => undefined);
  }
}

export function useLandingAudio({ isNarrativeActive }: IUseLandingAudioOptions): ILandingAudioControls {
  const narrationRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      pauseAllAudio();
    };
  }, []);

  useEffect(() => {
    if (isNarrativeActive) {
      narrationRef.current = getAudio(PATHS.narrationTrack, VOLUMES.narrationTrack);
      if (narrationRef.current) {
        narrationRef.current.loop = false;
        narrationRef.current.currentTime = 0;
        const maybePromise = narrationRef.current.play();
        if (maybePromise && typeof maybePromise.catch === "function") {
          void maybePromise.catch(() => undefined);
        }
      }
      return;
    }
    if (narrationRef.current) {
      narrationRef.current.pause();
      narrationRef.current.currentTime = 0;
    }
  }, [isNarrativeActive]);

  const playButtonClick = useCallback(() => {
    safePlay(getAudio(PATHS.buttonClick, VOLUMES.buttonClick));
  }, []);

  const playTerminalBoot = useCallback(() => {
    safePlay(getAudio(PATHS.terminalBoot, VOLUMES.terminalBoot));
  }, []);

  const playFormEntry = useCallback(() => {
    safePlay(getAudio(PATHS.formEntry, VOLUMES.formEntry));
  }, []);

  const playHeroCardDeploy = useCallback((delayMs = 0) => {
    window.setTimeout(() => safePlay(getAudio(PATHS.heroDeploy, VOLUMES.heroDeploy)), Math.max(0, delayMs));
  }, []);

  const stopNarrationTrack = useCallback(() => {
    if (!narrationRef.current) return;
    narrationRef.current.pause();
    narrationRef.current.currentTime = 0;
  }, []);

  return {
    playButtonClick,
    playTerminalBoot,
    playFormEntry,
    playHeroCardDeploy,
    stopNarrationTrack,
  };
}