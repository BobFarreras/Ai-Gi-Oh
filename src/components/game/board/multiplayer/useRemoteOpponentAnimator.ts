// src/components/game/board/multiplayer/useRemoteOpponentAnimator.ts - Expone un aplicador de acciones del rival que reproduce su coreografía visual, serializado.
"use client";

import { MutableRefObject, useCallback, useLayoutEffect, useRef } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { animateRemoteAction, IRemoteAnimationContext } from "./animate-remote-action";

interface IUseRemoteOpponentAnimatorParams {
  gameStateRef: MutableRefObject<GameState>;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  setIsAnimating: (value: boolean) => void;
  setActiveAttackerId: (value: string | null) => void;
  setRevealedEntities: (value: string[] | ((prev: string[]) => string[])) => void;
  clearSelection: () => void;
  clearError: () => void;
}

/**
 * Devuelve `applyRemoteAction(action)`: reproduce la coreografía de la acción del
 * rival y la aplica. Las animaciones se serializan en una cola para que no se
 * solapen cuando llegan varias acciones seguidas.
 */
export function useRemoteOpponentAnimator(
  params: IUseRemoteOpponentAnimatorParams,
): (action: IMatchActionPayload) => Promise<void> {
  const paramsRef = useRef(params);
  useLayoutEffect(() => { paramsRef.current = params; });
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());

  return useCallback((action: IMatchActionPayload) => {
    const current = paramsRef.current;
    const ctx: IRemoteAnimationContext = {
      getState: () => current.gameStateRef.current,
      applyTransition: current.applyTransition,
      setIsAnimating: current.setIsAnimating,
      setActiveAttackerId: current.setActiveAttackerId,
      setRevealedEntities: current.setRevealedEntities,
      clearSelection: current.clearSelection,
      clearError: current.clearError,
    };
    // El rival es siempre playerB en el cliente local (el local es playerA).
    const opponentId = current.gameStateRef.current.playerB.id;
    const run = queueRef.current.then(() => animateRemoteAction(ctx, opponentId, action));
    queueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);
}
