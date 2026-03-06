// src/components/landing/useLandingAudio.ts - Gestiona efectos de sonido y soundtrack de narración para la landing.
"use client";

import { useCallback, useEffect, useRef } from "react";

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

function safePlay(audio: HTMLAudioElement | null): void {
  if (!audio) return;
  audio.currentTime = 0;
  const maybePromise = audio.play();
  if (maybePromise && typeof maybePromise.catch === "function") {
    void maybePromise.catch(() => undefined);
  }
}

export function useLandingAudio({ isNarrativeActive }: IUseLandingAudioOptions): ILandingAudioControls {
  const buttonClickRef = useRef<HTMLAudioElement | null>(null);
  const terminalBootRef = useRef<HTMLAudioElement | null>(null);
  const formEntryRef = useRef<HTMLAudioElement | null>(null);
  const heroDeployRef = useRef<HTMLAudioElement | null>(null);
  const narrationTrackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    buttonClickRef.current = new Audio("/audio/landing/button-click.mp3");
    buttonClickRef.current.volume = 0.16;
    terminalBootRef.current = new Audio("/audio/landing/terminal.mp3");
    terminalBootRef.current.volume = 0.5;
    formEntryRef.current = new Audio("/audio/landing/formulario.mp3");
    formEntryRef.current.volume = 0.42;
    heroDeployRef.current = new Audio("/audio/landing/hero.mp3");
    heroDeployRef.current.volume = 0.14;
    narrationTrackRef.current = new Audio("/audio/landing/soundtrack.mp3");
    narrationTrackRef.current.loop = false;
    narrationTrackRef.current.volume = 0.38;

    return () => {
      [buttonClickRef, terminalBootRef, formEntryRef, heroDeployRef, narrationTrackRef].forEach((audioRef) => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      });
    };
  }, []);

  useEffect(() => {
    const narrationAudio = narrationTrackRef.current;
    if (!narrationAudio) return;
    if (isNarrativeActive) {
      narrationAudio.currentTime = 0;
      const maybePromise = narrationAudio.play();
      if (maybePromise && typeof maybePromise.catch === "function") {
        void maybePromise.catch(() => undefined);
      }
      return;
    }
    narrationAudio.pause();
    narrationAudio.currentTime = 0;
  }, [isNarrativeActive]);

  const playButtonClick = useCallback(() => {
    safePlay(buttonClickRef.current);
  }, []);
  const playTerminalBoot = useCallback(() => {
    safePlay(terminalBootRef.current);
  }, []);

  const playFormEntry = useCallback(() => {
    safePlay(formEntryRef.current);
  }, []);

  const playHeroCardDeploy = useCallback((delayMs = 0) => {
    window.setTimeout(() => safePlay(heroDeployRef.current), Math.max(0, delayMs));
  }, []);

  const stopNarrationTrack = useCallback(() => {
    if (!narrationTrackRef.current) return;
    narrationTrackRef.current.pause();
    narrationTrackRef.current.currentTime = 0;
  }, []);

  return {
    playButtonClick,
    playTerminalBoot,
    playFormEntry,
    playHeroCardDeploy,
    stopNarrationTrack,
  };
}
