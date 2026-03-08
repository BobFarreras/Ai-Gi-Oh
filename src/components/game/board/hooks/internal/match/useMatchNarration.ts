// src/components/game/board/hooks/internal/match/useMatchNarration.ts - Runtime de narración en cliente sincronizado con combatLog, cola visual y audio local.
"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { buildDefaultMatchNarrationPack } from "@/components/game/board/narration/build-default-match-narration-pack";
import { selectNarrationActionForResult, selectNarrationActionsFromEvents } from "@/components/game/board/narration/select-narration-actions";
import { IMatchNarrationPack, IResolvedNarrationAction } from "@/components/game/board/narration/types";

interface UseMatchNarrationParams {
  combatLog: ICombatLogEvent[];
  winnerPlayerId: string | "DRAW" | null;
  playerId: string;
  opponentId: string;
  isMuted: boolean;
  narrationPack?: IMatchNarrationPack | null;
}

interface IMatchNarrationState {
  queue: IResolvedNarrationAction[];
  activeAction: IResolvedNarrationAction | null;
  hudDialogueByPlayerId: Record<string, string | null>;
}

type MatchNarrationAction =
  | { type: "ENQUEUE"; actions: IResolvedNarrationAction[] }
  | { type: "START_NEXT" }
  | { type: "CLEAR_ACTIVE" };

const initialState: IMatchNarrationState = { queue: [], activeAction: null, hudDialogueByPlayerId: {} };
const RESULT_NARRATION_DELAY_MS = 1900;
const CINEMATIC_ENTRY_DELAY_MS = 320;

function reducer(state: IMatchNarrationState, action: MatchNarrationAction): IMatchNarrationState {
  if (action.type === "ENQUEUE") {
    if (action.actions.length === 0) return state;
    return { ...state, queue: [...state.queue, ...action.actions] };
  }
  if (action.type === "START_NEXT") {
    if (state.activeAction || state.queue.length === 0) return state;
    const [next, ...rest] = state.queue;
    if (next.line.channel === "HUD") return { ...state, queue: rest, activeAction: next, hudDialogueByPlayerId: { ...state.hudDialogueByPlayerId, [next.actorPlayerId]: next.line.text } };
    return { ...state, queue: rest, activeAction: next };
  }
  if (!state.activeAction) return state;
  if (state.activeAction.line.channel === "HUD") {
    return {
      ...state,
      activeAction: null,
      hudDialogueByPlayerId: { ...state.hudDialogueByPlayerId, [state.activeAction.actorPlayerId]: null },
    };
  }
  return { ...state, activeAction: null };
}

export function useMatchNarration({ combatLog, winnerPlayerId, playerId, opponentId, isMuted, narrationPack }: UseMatchNarrationParams) {
  const pack = useMemo(() => narrationPack ?? buildDefaultMatchNarrationPack(), [narrationPack]);
  const processedRef = useRef(0);
  const queuedIntroRef = useRef(false);
  const queuedResultRef = useRef(false);
  const triggerCountRef = useRef<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (queuedIntroRef.current) return;
    const introLine = pack.lines.find((line) => line.trigger === "MATCH_START" && line.actor === "OPPONENT") ?? pack.lines.find((line) => line.trigger === "MATCH_START");
    queuedIntroRef.current = true;
    if (!introLine) return;
    triggerCountRef.current.MATCH_START = 1;
    dispatch({ type: "ENQUEUE", actions: [{ line: introLine, actorPlayerId: introLine.actor === "PLAYER" ? playerId : opponentId, sourceEvent: null }] });
  }, [opponentId, pack, playerId]);

  useEffect(() => {
    const nextEvents = combatLog.slice(processedRef.current);
    processedRef.current = combatLog.length;
    if (nextEvents.length === 0) return;
    const nextActions = selectNarrationActionsFromEvents(nextEvents, pack, { playerId, opponentId });
    const filteredActions = nextActions.filter((action) => {
      const trigger = action.line.trigger;
      const nextCount = (triggerCountRef.current[trigger] ?? 0) + 1;
      triggerCountRef.current[trigger] = nextCount;
      if (trigger === "MATCH_START" || trigger === "PLAYER_WIN" || trigger === "PLAYER_LOSE") return nextCount === 1;
      return nextCount === 1 || (nextCount > 1 && (nextCount - 1) % 3 === 0);
    });
    dispatch({ type: "ENQUEUE", actions: filteredActions });
  }, [combatLog, pack, playerId, opponentId]);

  useEffect(() => {
    if (queuedResultRef.current || !winnerPlayerId) return;
    const resultAction = selectNarrationActionForResult(winnerPlayerId, pack, { playerId, opponentId });
    queuedResultRef.current = true;
    if (!resultAction) return;
    const timeout = window.setTimeout(() => {
      dispatch({ type: "ENQUEUE", actions: [resultAction] });
    }, RESULT_NARRATION_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [winnerPlayerId, pack, playerId, opponentId]);

  useEffect(() => {
    if (state.activeAction || state.queue.length === 0) return;
    dispatch({ type: "START_NEXT" });
  }, [state.activeAction, state.queue.length]);

  useEffect(() => {
    if (!state.activeAction) return;
    const activeAction = state.activeAction;
    const audioDelay = activeAction.line.channel === "CINEMATIC" ? CINEMATIC_ENTRY_DELAY_MS : 0;
    let audioTimeout: number | null = null;
    if (!isMuted && activeAction.line.audioUrl) {
      audioTimeout = window.setTimeout(() => {
        audioRef.current?.pause();
        audioRef.current = new Audio(activeAction.line.audioUrl!);
        audioRef.current.volume = 0.7;
        void audioRef.current.play().catch(() => undefined);
      }, audioDelay);
    }
    const clearDelay = activeAction.line.channel === "CINEMATIC" ? CINEMATIC_ENTRY_DELAY_MS : 0;
    const timeout = window.setTimeout(() => {
      dispatch({ type: "CLEAR_ACTIVE" });
    }, (activeAction.line.durationMs ?? (activeAction.line.channel === "HUD" ? 1800 : 3200)) + clearDelay);
    return () => {
      if (audioTimeout) window.clearTimeout(audioTimeout);
      window.clearTimeout(timeout);
    };
  }, [isMuted, state.activeAction]);

  useEffect(() => () => audioRef.current?.pause(), []);

  return {
    hudDialogueByPlayerId: state.hudDialogueByPlayerId,
    activeCinematicAction: state.activeAction?.line.channel === "CINEMATIC" ? state.activeAction : null,
  };
}
