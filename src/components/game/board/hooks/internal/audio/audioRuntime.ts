// src/components/game/board/hooks/internal/audio/audioRuntime.ts - Descripción breve del módulo.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { AUDIO_CATALOG, AUDIO_CHANNEL_VOLUME, AudioTrackId } from "@/core/config/audio-catalog";
import { isAudioPlaybackBlocked, registerManagedAudio } from "./audio-gate";

export function createAudio(trackId: AudioTrackId, isMusic: boolean): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof window.Audio === "undefined") return null;
  if (isAudioPlaybackBlocked()) return null;
  const track = AUDIO_CATALOG[trackId];
  const audio = new Audio(track.path);
  audio.preload = "auto";
  audio.loop = Boolean(track.loop);
  audio.volume = Math.max(0, Math.min(1, track.volume * (isMusic ? AUDIO_CHANNEL_VOLUME.music : AUDIO_CHANNEL_VOLUME.sfx)));
  return audio;
}

/** Crea instancia de audio por ruta directa (útil para efectos por acción). */
export function createAudioFromPath(path: string, volume = 0.75): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof window.Audio === "undefined" || path.trim().length === 0) return null;
  if (isAudioPlaybackBlocked()) return null;
  const audio = new Audio(path);
  audio.preload = "auto";
  audio.loop = false;
  audio.volume = Math.max(0, Math.min(1, volume * AUDIO_CHANNEL_VOLUME.sfx));
  return audio;
}

export function mapEventToTrack(event: ICombatLogEvent): AudioTrackId | null {
  if (event.eventType === "TURN_STARTED") return "TURN_PASS";
  if (event.eventType === "PHASE_CHANGED") return "BANNER";
  if (event.eventType === "AUTO_PHASE_ADVANCED") return "TURN_PASS";
  if (event.eventType === "TURN_GUARD_SHOWN") return "BANNER";
  if (event.eventType === "TURN_GUARD_CONFIRMED" || event.eventType === "TURN_GUARD_CANCELLED") return "BUTTON_CLICK";
  if (event.eventType === "ATTACK_DECLARED") return "ATTACK";
  if (event.eventType === "TRAP_TRIGGERED") {
    const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
    const effectAction = payload && typeof payload.effectAction === "string" ? payload.effectAction : "";
    if (effectAction === "DAMAGE") return "LIFE_LOSS";
    if (effectAction === "NEGATE_ATTACK_AND_DESTROY_ATTACKER" || effectAction === "NEGATE_OPPONENT_TRAP_AND_DESTROY") return "DAMAGE";
    if (effectAction === "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN") return "DAMAGE";
    return "MAGIC_ATTACK";
  }
  if (event.eventType === "DIRECT_DAMAGE") return "LIFE_LOSS";
  if (event.eventType === "FUSION_SUMMONED") return "FUSION_SUMMON";
  if (event.eventType !== "CARD_PLAYED") return null;

  const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
  const cardType = payload && typeof payload.cardType === "string" ? payload.cardType : "";
  const mode = payload && typeof payload.mode === "string" ? payload.mode : "";
  const effectAction = payload && typeof payload.effectAction === "string" ? payload.effectAction : "";
  if (cardType === "EXECUTION" && mode === "ACTIVATE") {
    if (effectAction === "RESTORE_ENERGY" || effectAction === "DRAIN_OPPONENT_ENERGY" || effectAction === "SET_CARD_DUEL_PROGRESS") return null;
    if (effectAction === "DAMAGE") return "LIFE_LOSS";
    if (effectAction === "HEAL") return "BANNER";
    if (effectAction === "DRAW_CARD") return "DRAW_CARD";
    if (effectAction === "FUSION_SUMMON") return "FUSION_SUMMON";
    return "MAGIC_ATTACK";
  }
  if (cardType === "ENTITY") return "SUMMON_CARD";
  return null;
}

export function safePlay(audio: HTMLAudioElement | null): void {
  if (!audio || isAudioPlaybackBlocked()) return;
  registerManagedAudio(audio);
  const playPromise = audio?.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => undefined);
  }
}

/** Reproduce audio principal y, si falla, intenta fallback para no perder feedback sonoro. */
export function safePlayWithFallback(audio: HTMLAudioElement | null, buildFallback: () => HTMLAudioElement | null): void {
  if (isAudioPlaybackBlocked()) return;
  if (audio) registerManagedAudio(audio);
  const playPromise = audio?.play();
  if (!playPromise || typeof playPromise.catch !== "function") {
    safePlay(buildFallback());
    return;
  }
  playPromise.catch(() => {
    safePlay(buildFallback());
  });
}

