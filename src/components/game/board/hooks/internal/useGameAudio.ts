// src/components/game/board/hooks/internal/useGameAudio.ts - Gestiona soundtrack y efectos del tablero a partir de combatLog y estado UI.
import { useCallback, useEffect, useRef } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { AudioTrackId } from "@/core/config/audio-catalog";
import { createAudio, mapEventToTrack, safePlay } from "./audio/audioRuntime";

interface UseGameAudioParams {
  combatLog: ICombatLogEvent[];
  winnerPlayerId: string | null;
  playerId: string;
  isHistoryOpen: boolean;
  hasSelectedCard: boolean;
  lastErrorCode: string | null;
  isMuted: boolean;
  isPaused: boolean;
  disableBaseSoundtrack?: boolean;
}

function resolveDuelEndTrack(winnerPlayerId: string, playerId: string): AudioTrackId {
  if (winnerPlayerId === "DRAW") return "DUEL_DRAW";
  return winnerPlayerId === playerId ? "DUEL_WIN" : "GAME_OVER";
}

export function useGameAudio({
  combatLog,
  winnerPlayerId,
  playerId,
  isHistoryOpen,
  hasSelectedCard,
  lastErrorCode,
  isMuted,
  isPaused,
  disableBaseSoundtrack = false,
}: UseGameAudioParams) {
  const processedRef = useRef(0);
  const soundtrackRef = useRef<HTMLAudioElement | null>(null);
  const prevHistoryOpenRef = useRef(isHistoryOpen);
  const prevSelectedCardRef = useRef(hasSelectedCard);
  const prevErrorRef = useRef<string | null>(lastErrorCode);

  useEffect(() => {
    if (disableBaseSoundtrack) {
      soundtrackRef.current?.pause();
      soundtrackRef.current = null;
      return;
    }
    if (!soundtrackRef.current) soundtrackRef.current = createAudio("SOUNDTRACK", true);
    return () => {
      soundtrackRef.current?.pause();
      soundtrackRef.current = null;
    };
  }, [disableBaseSoundtrack]);

  useEffect(() => {
    const soundtrack = soundtrackRef.current;
    if (!soundtrack) return;
    if (isMuted || winnerPlayerId || isPaused) {
      soundtrack.pause();
      if (winnerPlayerId) soundtrack.currentTime = 0;
      return;
    }
    safePlay(soundtrack);
  }, [isMuted, isPaused, winnerPlayerId]);

  useEffect(() => {
    if (isMuted) {
      processedRef.current = combatLog.length;
      return;
    }
    const nextEvents = combatLog.slice(processedRef.current);
    processedRef.current = combatLog.length;
    nextEvents.forEach((event) => {
      const track = mapEventToTrack(event);
      if (track) safePlay(createAudio(track, false));
    });
  }, [combatLog, isMuted]);

  useEffect(() => {
    if (isMuted || !winnerPlayerId) return;
    const track = resolveDuelEndTrack(winnerPlayerId, playerId);
    safePlay(createAudio(track, false));
    if (track === "DUEL_WIN") safePlay(createAudio("VICTORY_STINGER", false));
  }, [isMuted, playerId, winnerPlayerId]);

  useEffect(() => {
    if (isMuted) {
      prevHistoryOpenRef.current = isHistoryOpen;
      return;
    }
    if (prevHistoryOpenRef.current !== isHistoryOpen) {
      safePlay(createAudio(isHistoryOpen ? "SIDEBAR_OPEN" : "SIDEBAR_CLOSE", false));
      prevHistoryOpenRef.current = isHistoryOpen;
    }
  }, [isHistoryOpen, isMuted]);

  useEffect(() => {
    if (isMuted) {
      prevSelectedCardRef.current = hasSelectedCard;
      return;
    }
    if (prevSelectedCardRef.current !== hasSelectedCard) {
      safePlay(createAudio(hasSelectedCard ? "SIDEBAR_OPEN" : "SIDEBAR_CLOSE", false));
      prevSelectedCardRef.current = hasSelectedCard;
    }
  }, [hasSelectedCard, isMuted]);

  useEffect(() => {
    if (isMuted) {
      prevErrorRef.current = lastErrorCode;
      return;
    }
    if (lastErrorCode && prevErrorRef.current !== lastErrorCode) {
      safePlay(createAudio("ERROR_ACTION", false));
    }
    prevErrorRef.current = lastErrorCode;
  }, [isMuted, lastErrorCode]);

  const playTimerExpired = useCallback(() => {
    if (!isMuted) safePlay(createAudio("TIMER_END", false));
  }, [isMuted]);

  const playTimerWarning = useCallback(() => {
    if (!isMuted) safePlay(createAudio("TIMER_WARNING", false));
  }, [isMuted]);

  const playButtonClick = useCallback(() => {
    if (!isMuted) safePlay(createAudio("BUTTON_CLICK", false));
  }, [isMuted]);
  const playBanner = useCallback(() => {
    if (!isMuted) safePlay(createAudio("BANNER", false));
  }, [isMuted]);

  return { playTimerExpired, playTimerWarning, playButtonClick, playBanner };
}
