// src/components/game/board/hooks/internal/audio/audio-gate.ts - Controla bloqueo global y ciclo de vida de audios activos del tablero.
"use client";

const activeAudioSet = new Set<HTMLAudioElement>();
let isBlocked = false;

function unregisterAudio(audio: HTMLAudioElement): void {
  activeAudioSet.delete(audio);
}

/** Registra un audio para poder detenerlo de forma global al mutear/pausar. */
export function registerManagedAudio(audio: HTMLAudioElement): void {
  activeAudioSet.add(audio);
  audio.onended = () => unregisterAudio(audio);
}

/** Marca bloqueo global de audio y corta cualquier reproducción activa si aplica. */
export function setAudioPlaybackBlocked(blocked: boolean): void {
  isBlocked = blocked;
  if (!blocked) return;
  activeAudioSet.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeAudioSet.clear();
}

/** Devuelve estado global de bloqueo de audio del tablero. */
export function isAudioPlaybackBlocked(): boolean {
  return isBlocked;
}
