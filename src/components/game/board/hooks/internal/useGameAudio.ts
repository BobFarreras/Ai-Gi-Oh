// src/components/game/board/hooks/internal/useGameAudio.ts - Gestiona soundtrack y efectos del tablero a partir de combatLog y estado UI.
import { useCallback, useEffect, useRef } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { AudioTrackId } from "@/core/config/audio-catalog";
import { resolveEffectAudioPath } from "./audio/effect-audio-registry";
import { createAudio, createAudioFromPath, mapEventToTrack, safePlay, safePlayWithFallback } from "./audio/audioRuntime";
import { setAudioPlaybackBlocked } from "./audio/audio-gate";

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
    setAudioPlaybackBlocked(isMuted || isPaused);
  }, [isMuted, isPaused]);

  const playCombatEventAudio = useCallback((event: ICombatLogEvent) => {
    const effectAudioPath = resolveEffectAudioPath(event);
    if (effectAudioPath) {
      safePlayWithFallback(
        createAudioFromPath(effectAudioPath, 0.76),
        () => {
          const fallbackTrack = mapEventToTrack(event);
          return fallbackTrack ? createAudio(fallbackTrack, false) : null;
        },
      );
      return;
    }
    const track = mapEventToTrack(event);
    if (track) safePlay(createAudio(track, false));
  }, []);

  useEffect(() => {
    if (disableBaseSoundtrack) {
      soundtrackRef.current?.pause();
      soundtrackRef.current = null;
      return;
    }
    if (!soundtrackRef.current && !isMuted && !isPaused) {
      soundtrackRef.current = createAudio("SOUNDTRACK", true);
    }
    return () => {
      soundtrackRef.current?.pause();
      soundtrackRef.current = null;
    };
  }, [disableBaseSoundtrack, isMuted, isPaused]);

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
    if (isMuted || isPaused) {
      processedRef.current = combatLog.length;
      return;
    }
    const nextEvents = combatLog.slice(processedRef.current);
    processedRef.current = combatLog.length;
    nextEvents.forEach((event) => {
      playCombatEventAudio(event);
    });
  }, [combatLog, isMuted, isPaused, playCombatEventAudio]);

  useEffect(() => {
    if (isMuted || isPaused || !winnerPlayerId) return;
    const track = resolveDuelEndTrack(winnerPlayerId, playerId);
    safePlay(createAudio(track, false));
    if (track === "DUEL_WIN") safePlay(createAudio("VICTORY_STINGER", false));
  }, [isMuted, isPaused, playerId, winnerPlayerId]);

  useEffect(() => {
    if (isMuted || isPaused) {
      prevHistoryOpenRef.current = isHistoryOpen;
      return;
    }
    if (prevHistoryOpenRef.current !== isHistoryOpen) {
      safePlay(createAudio(isHistoryOpen ? "SIDEBAR_OPEN" : "SIDEBAR_CLOSE", false));
      prevHistoryOpenRef.current = isHistoryOpen;
    }
  }, [isHistoryOpen, isMuted, isPaused]);

  useEffect(() => {
    if (isMuted || isPaused) {
      prevSelectedCardRef.current = hasSelectedCard;
      return;
    }
    if (prevSelectedCardRef.current !== hasSelectedCard) {
      safePlay(createAudio(hasSelectedCard ? "SIDEBAR_OPEN" : "SIDEBAR_CLOSE", false));
      prevSelectedCardRef.current = hasSelectedCard;
    }
  }, [hasSelectedCard, isMuted, isPaused]);

  useEffect(() => {
    if (isMuted || isPaused) {
      prevErrorRef.current = lastErrorCode;
      return;
    }
    if (lastErrorCode && prevErrorRef.current !== lastErrorCode) {
      safePlay(createAudio("ERROR_ACTION", false));
    }
    prevErrorRef.current = lastErrorCode;
  }, [isMuted, isPaused, lastErrorCode]);

  const playTimerExpired = useCallback(() => {
    if (!isMuted && !isPaused) safePlay(createAudio("TIMER_END", false));
  }, [isMuted, isPaused]);

  const playTimerWarning = useCallback(() => {
    if (!isMuted && !isPaused) safePlay(createAudio("TIMER_WARNING", false));
  }, [isMuted, isPaused]);

  const playButtonClick = useCallback(() => {
    if (!isMuted && !isPaused) safePlay(createAudio("BUTTON_CLICK", false));
  }, [isMuted, isPaused]);
  const playBanner = useCallback(() => {
    if (!isMuted && !isPaused) safePlay(createAudio("BANNER", false));
  }, [isMuted, isPaused]);

  return { playTimerExpired, playTimerWarning, playButtonClick, playBanner };
}
