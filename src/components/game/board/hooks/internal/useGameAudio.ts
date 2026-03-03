import { useCallback, useEffect, useRef } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { AUDIO_CATALOG, AUDIO_CHANNEL_VOLUME, AudioTrackId } from "@/core/config/audio-catalog";

interface UseGameAudioParams {
  combatLog: ICombatLogEvent[];
  winnerPlayerId: string | null;
  playerId: string;
  isHistoryOpen: boolean;
  hasSelectedCard: boolean;
  lastErrorCode: string | null;
  isMuted: boolean;
}

function createAudio(trackId: AudioTrackId, isMusic: boolean): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof window.Audio === "undefined") {
    return null;
  }
  const track = AUDIO_CATALOG[trackId];
  const audio = new Audio(track.path);
  audio.preload = "auto";
  audio.loop = Boolean(track.loop);
  audio.volume = Math.max(0, Math.min(1, track.volume * (isMusic ? AUDIO_CHANNEL_VOLUME.music : AUDIO_CHANNEL_VOLUME.sfx)));
  return audio;
}

function mapEventToTrack(event: ICombatLogEvent): AudioTrackId | null {
  if (event.eventType === "TURN_STARTED") return "TURN_PASS";
  if (event.eventType === "PHASE_CHANGED") return "BANNER";
  if (event.eventType === "ATTACK_DECLARED") return "ATTACK";
  if (event.eventType === "DIRECT_DAMAGE") return "LIFE_LOSS";
  if (event.eventType === "FUSION_SUMMONED") return "FUSION_SUMMON";
  if (event.eventType === "CARD_PLAYED") {
    const cardType =
      typeof event.payload === "object" && event.payload !== null && "cardType" in event.payload
        ? String((event.payload as Record<string, unknown>).cardType)
        : "";
    const mode =
      typeof event.payload === "object" && event.payload !== null && "mode" in event.payload
        ? String((event.payload as Record<string, unknown>).mode)
        : "";
    if (cardType === "EXECUTION" && mode === "ACTIVATE") return "MAGIC_ATTACK";
    if (cardType === "ENTITY") return "SUMMON_CARD";
  }
  return null;
}

export function useGameAudio({
  combatLog,
  winnerPlayerId,
  playerId,
  isHistoryOpen,
  hasSelectedCard,
  lastErrorCode,
  isMuted,
}: UseGameAudioParams) {
  const processedRef = useRef(0);
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const prevHistoryOpenRef = useRef(isHistoryOpen);
  const prevSelectedCardRef = useRef(hasSelectedCard);
  const prevErrorRef = useRef<string | null>(lastErrorCode);

  useEffect(() => {
    if (soundtrackRef.current) return;
    soundtrackRef.current = createAudio("SOUNDTRACK", true);
  }, []);

  useEffect(() => {
    const soundtrack = soundtrackRef.current;
    if (!soundtrack) return;
    if (isMuted) {
      soundtrack.pause();
      return;
    }
    const playPromise = soundtrack.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => undefined);
    }
  }, [isMuted]);

  useEffect(() => {
    if (isMuted) {
      processedRef.current = combatLog.length;
      return;
    }
    const nextEvents = combatLog.slice(processedRef.current);
    processedRef.current = combatLog.length;
    for (const event of nextEvents) {
      const track = mapEventToTrack(event);
      if (!track) continue;
      const audio = createAudio(track, false);
      const playPromise = audio?.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => undefined);
      }
    }
  }, [combatLog, isMuted]);

  useEffect(() => {
    if (isMuted || !winnerPlayerId) return;
    const track: AudioTrackId =
      winnerPlayerId === "DRAW" ? "DUEL_DRAW" : winnerPlayerId === playerId ? "DUEL_WIN" : "GAME_OVER";
    const audio = createAudio(track, false);
    const playPromise = audio?.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => undefined);
    }
    if (track === "DUEL_WIN") {
      const stinger = createAudio("VICTORY_STINGER", false);
      const stingerPromise = stinger?.play();
      if (stingerPromise && typeof stingerPromise.catch === "function") {
        stingerPromise.catch(() => undefined);
      }
    }
  }, [isMuted, playerId, winnerPlayerId]);

  useEffect(() => {
    if (isMuted) {
      prevHistoryOpenRef.current = isHistoryOpen;
      return;
    }
    if (prevHistoryOpenRef.current !== isHistoryOpen) {
      const audio = createAudio(isHistoryOpen ? "SIDEBAR_OPEN" : "SIDEBAR_CLOSE", false);
      void audio?.play().catch(() => undefined);
      prevHistoryOpenRef.current = isHistoryOpen;
    }
  }, [isHistoryOpen, isMuted]);

  useEffect(() => {
    if (isMuted) {
      prevSelectedCardRef.current = hasSelectedCard;
      return;
    }
    if (prevSelectedCardRef.current !== hasSelectedCard) {
      const audio = createAudio(hasSelectedCard ? "SIDEBAR_OPEN" : "SIDEBAR_CLOSE", false);
      void audio?.play().catch(() => undefined);
      prevSelectedCardRef.current = hasSelectedCard;
    }
  }, [hasSelectedCard, isMuted]);

  useEffect(() => {
    if (isMuted) {
      prevErrorRef.current = lastErrorCode;
      return;
    }
    if (lastErrorCode && prevErrorRef.current !== lastErrorCode) {
      const audio = createAudio("ERROR_ACTION", false);
      const playPromise = audio?.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => undefined);
      }
    }
    prevErrorRef.current = lastErrorCode;
  }, [isMuted, lastErrorCode]);

  const playTimerExpired = useCallback(() => {
    if (isMuted) return;
    const audio = createAudio("TIMER_END", false);
    const playPromise = audio?.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => undefined);
    }
  }, [isMuted]);

  const playTimerWarning = useCallback(() => {
    if (isMuted) return;
    const audio = createAudio("TIMER_WARNING", false);
    const playPromise = audio?.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => undefined);
    }
  }, [isMuted]);

  const playButtonClick = useCallback(() => {
    if (isMuted) return;
    const audio = createAudio("BUTTON_CLICK", false);
    const playPromise = audio?.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => undefined);
    }
  }, [isMuted]);

  return { playTimerExpired, playTimerWarning, playButtonClick };
}
