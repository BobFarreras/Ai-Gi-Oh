import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { AUDIO_CATALOG, AUDIO_CHANNEL_VOLUME, AudioTrackId } from "@/core/config/audio-catalog";

export function createAudio(trackId: AudioTrackId, isMusic: boolean): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof window.Audio === "undefined") return null;
  const track = AUDIO_CATALOG[trackId];
  const audio = new Audio(track.path);
  audio.preload = "auto";
  audio.loop = Boolean(track.loop);
  audio.volume = Math.max(0, Math.min(1, track.volume * (isMusic ? AUDIO_CHANNEL_VOLUME.music : AUDIO_CHANNEL_VOLUME.sfx)));
  return audio;
}

export function mapEventToTrack(event: ICombatLogEvent): AudioTrackId | null {
  if (event.eventType === "TURN_STARTED") return "TURN_PASS";
  if (event.eventType === "PHASE_CHANGED") return "BANNER";
  if (event.eventType === "ATTACK_DECLARED") return "ATTACK";
  if (event.eventType === "DIRECT_DAMAGE") return "LIFE_LOSS";
  if (event.eventType === "FUSION_SUMMONED") return "FUSION_SUMMON";
  if (event.eventType !== "CARD_PLAYED") return null;

  const payload = typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
  const cardType = payload && typeof payload.cardType === "string" ? payload.cardType : "";
  const mode = payload && typeof payload.mode === "string" ? payload.mode : "";
  if (cardType === "EXECUTION" && mode === "ACTIVATE") return "MAGIC_ATTACK";
  if (cardType === "ENTITY") return "SUMMON_CARD";
  return null;
}

export function safePlay(audio: HTMLAudioElement | null): void {
  const playPromise = audio?.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => undefined);
  }
}
