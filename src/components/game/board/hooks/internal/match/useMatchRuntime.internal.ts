// src/components/game/board/hooks/internal/match/useMatchRuntime.internal.ts - Agrupa composición de parámetros y resolución de trampas para mantener useMatchRuntime compacto.
import { MutableRefObject, useCallback, useEffect, useRef } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { toBoardUiError } from "../boardError";
import { ITrapActivationDecision, ITrapEligibleOption, TrapDecisionTrigger } from "../board-state/useBoardUiState";
import { IUseMatchUiStateResult } from "./useMatchUiState";

interface IMatchRuntimeBasics {
  uiState: IUseMatchUiStateResult;
  gameStateRef: MutableRefObject<GameState>;
  winnerPlayerId: string | "DRAW" | null;
}

interface IUseTrapDecisionManagerInput {
  uiState: IUseMatchUiStateResult;
}

export function useAutoSyncGameStateRef(gameStateRef: MutableRefObject<GameState>, gameState: GameState): void {
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameStateRef, gameState]);
}

export function useAutoClearBoardError(uiState: IUseMatchUiStateResult): void {
  useEffect(() => {
    if (!uiState.lastError) return;
    const timeoutId = setTimeout(() => uiState.setLastError(null), 3600);
    return () => clearTimeout(timeoutId);
  }, [uiState]);
}

export function useApplyTransition({ gameStateRef, uiState }: Pick<IMatchRuntimeBasics, "gameStateRef" | "uiState">) {
  return useCallback(
    (transition: (state: GameState) => GameState): GameState | null => {
      try {
        const nextState = transition(gameStateRef.current);
        gameStateRef.current = nextState;
        uiState.setGameState(nextState);
        return nextState;
      } catch (error: unknown) {
        uiState.setLastError(toBoardUiError(error));
        return null;
      }
    },
    [gameStateRef, uiState],
  );
}

export function useAssertPlayerTurn({ gameStateRef, uiState, winnerPlayerId }: IMatchRuntimeBasics) {
  return useCallback((): boolean => {
    if (winnerPlayerId) {
      uiState.setLastError({ code: "GAME_RULE_ERROR", message: "La partida ya terminó." });
      return false;
    }
    if (gameStateRef.current.activePlayerId === gameStateRef.current.playerA.id) return true;
    uiState.setLastError({ code: "GAME_RULE_ERROR", message: "No es tu turno. Espera a que el rival termine su fase." });
    return false;
  }, [gameStateRef, uiState, winnerPlayerId]);
}

export function useTrapDecisionManager({ uiState }: IUseTrapDecisionManagerInput) {
  const trapDecisionResolverRef = useRef<((decision: ITrapActivationDecision) => void) | null>(null);
  // Ficha 4 (multi): timer de auto-pasar si el defensor no decide (AFK). Solo el flujo remoto lo activa.
  const trapDecisionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolveTrapActivationDecision = useCallback(
    (decision: ITrapActivationDecision) => {
      if (trapDecisionTimeoutRef.current) {
        clearTimeout(trapDecisionTimeoutRef.current);
        trapDecisionTimeoutRef.current = null;
      }
      uiState.setPendingTrapActivationPrompt(null);
      uiState.clearSelection();
      const resolver = trapDecisionResolverRef.current;
      trapDecisionResolverRef.current = null;
      resolver?.(decision);
    },
    [uiState],
  );

  // Ficha 4: recibe TODAS las trampas elegibles y resuelve con la que el jugador elija en el carrusel
  // (o "pasar"). La primera se muestra por defecto; la IA nunca llega aquí (decide en el motor). En multi,
  // `autoPassAfterMs` arma un temporizador que auto-pasa si el defensor no responde (evita colgar al atacante);
  // el fallback emite la MISMA acción "pasar" en ese cliente, así que ambos siguen convergiendo.
  const requestTrapActivationDecision = useCallback(
    (traps: ITrapEligibleOption[], trigger: TrapDecisionTrigger, options?: { autoPassAfterMs?: number }): Promise<ITrapActivationDecision> =>
      new Promise<ITrapActivationDecision>((resolve) => {
        if (traps.length === 0) {
          resolve({ activate: false });
          return;
        }
        trapDecisionResolverRef.current = resolve;
        uiState.setSelectedCard(traps[0].card);
        uiState.setPendingTrapActivationPrompt({ trigger, trapCard: traps[0].card, eligibleTraps: traps, currentIndex: 0 });
        if (options?.autoPassAfterMs && options.autoPassAfterMs > 0) {
          trapDecisionTimeoutRef.current = setTimeout(() => {
            trapDecisionTimeoutRef.current = null;
            resolveTrapActivationDecision({ activate: false });
          }, options.autoPassAfterMs);
        }
      }),
    [uiState, resolveTrapActivationDecision],
  );

  // Flecha ‹ ›: mueve el carrusel y sincroniza la carta previsualizada (para que el efecto de abajo no
  // interprete el cambio como "el jugador se desentendió" y pase).
  const cyclePendingTrap = useCallback(
    (direction: -1 | 1) => {
      const prompt = uiState.pendingTrapActivationPrompt;
      if (!prompt || prompt.eligibleTraps.length <= 1) return;
      const nextIndex = (prompt.currentIndex + direction + prompt.eligibleTraps.length) % prompt.eligibleTraps.length;
      const nextCard = prompt.eligibleTraps[nextIndex].card;
      uiState.setSelectedCard(nextCard);
      uiState.setPendingTrapActivationPrompt({ ...prompt, currentIndex: nextIndex, trapCard: nextCard });
    },
    [uiState],
  );

  useEffect(() => {
    const prompt = uiState.pendingTrapActivationPrompt;
    if (!prompt) return;
    // Se pasa la trampa solo si el jugador deselecciona o elige una carta AJENA a las trampas elegibles. El
    // ciclado (‹ ›) mueve la selección a OTRA trampa elegible: como `cyclePendingTrap` hace dos setState
    // (selectedCard + prompt), si no se batchean juntos habría un render intermedio donde selectedCard ya es la
    // nueva pero prompt.trapCard sigue siendo la vieja; comparar contra la LISTA (que no cambia al ciclar), en
    // vez de contra prompt.trapCard, evita ese falso "deselect" que en móvil cancelaba la trampa al pulsar ›.
    const selectedId = uiState.selectedCard?.id;
    const isOnEligibleTrap = Boolean(selectedId && prompt.eligibleTraps.some((option) => option.card.id === selectedId));
    if (isOnEligibleTrap) return;
    resolveTrapActivationDecision({ activate: false });
  }, [resolveTrapActivationDecision, uiState.pendingTrapActivationPrompt, uiState.selectedCard]);

  return { requestTrapActivationDecision, resolveTrapActivationDecision, cyclePendingTrap };
}
