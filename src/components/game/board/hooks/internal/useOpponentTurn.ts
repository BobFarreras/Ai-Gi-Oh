import { useEffect } from "react";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { sleep } from "./sleep";

interface IUseOpponentTurnParams {
  gameState: GameState;
  isAnimating: boolean;
  strategy: IOpponentStrategy;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  clearSelection: () => void;
  clearError: () => void;
  setIsAnimating: (value: boolean) => void;
  setActiveAttackerId: (value: string | null) => void;
  setRevealedEntities: (value: string[] | ((prev: string[]) => string[])) => void;
}

const OPPONENT_STEP_DELAY_MS = 950;
const OPPONENT_ATTACK_WINDUP_MS = 900;

function scoreCardForDiscard(card: ICard): number {
  if (card.type === "ENTITY") {
    return (card.attack ?? 0) + (card.defense ?? 0) - card.cost * 180;
  }

  const effectValue = card.effect?.value ?? 0;
  return effectValue - card.cost * 140;
}

function chooseEntityToSacrifice(entities: IBoardEntity[]): IBoardEntity | null {
  if (entities.length === 0) {
    return null;
  }

  return entities.reduce((weakest, current) => {
    const weakestScore = (weakest.card.attack ?? 0) + (weakest.card.defense ?? 0);
    const currentScore = (current.card.attack ?? 0) + (current.card.defense ?? 0);
    return currentScore < weakestScore ? current : weakest;
  });
}

function chooseCardToDiscard(hand: ICard[]): ICard | null {
  if (hand.length === 0) {
    return null;
  }

  return hand.reduce((worst, current) => (scoreCardForDiscard(current) < scoreCardForDiscard(worst) ? current : worst));
}

export function useOpponentTurn({
  gameState,
  isAnimating,
  strategy,
  applyTransition,
  clearSelection,
  clearError,
  setIsAnimating,
  setActiveAttackerId,
  setRevealedEntities,
}: IUseOpponentTurnParams): void {
  useEffect(() => {
    if (isAnimating || gameState.activePlayerId !== gameState.playerB.id) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      const opponentId = gameState.playerB.id;

      if (gameState.phase === "MAIN_1") {
        if (gameState.pendingTurnAction?.playerId === opponentId) {
          const selectedId =
            gameState.pendingTurnAction.type === "SACRIFICE_ENTITY_FOR_DRAW"
              ? chooseEntityToSacrifice(gameState.playerB.activeEntities)?.instanceId ?? null
              : chooseCardToDiscard(gameState.playerB.hand)?.id ?? null;

          if (!selectedId) {
            return;
          }

          setIsAnimating(true);
          await sleep(OPPONENT_STEP_DELAY_MS);
          const nextState = applyTransition((state) => GameEngine.resolvePendingTurnAction(state, opponentId, selectedId));
          setIsAnimating(false);

          if (nextState && nextState.activePlayerId === nextState.playerA.id) {
            clearSelection();
            clearError();
          }
          return;
        }

        // Prioridad: resolver activaciones pendientes para que el jugador vea
        // la carta ACTIVADA antes de aplicar su efecto.
        const pendingExecution = gameState.playerB.activeExecutions.find((entity) => entity.mode === "ACTIVATE");
        if (pendingExecution) {
          setIsAnimating(true);
          setActiveAttackerId(pendingExecution.instanceId);
          await sleep(OPPONENT_STEP_DELAY_MS);
          const nextState = applyTransition((state) => GameEngine.resolveExecution(state, opponentId, pendingExecution.instanceId));
          setActiveAttackerId(null);
          setIsAnimating(false);

          if (nextState && nextState.activePlayerId === nextState.playerA.id) {
            clearSelection();
            clearError();
          }
          return;
        }

        const playDecision = strategy.choosePlay(gameState, opponentId);
        if (playDecision) {
          setIsAnimating(true);
          const nextState = applyTransition((state) =>
            GameEngine.playCard(state, opponentId, playDecision.cardId, playDecision.mode),
          );

          // Si es ACTIVAR, se deja la carta visible un paso completo y se
          // resuelve en el siguiente ciclo de MAIN_1.
          if (playDecision.mode === "ACTIVATE" && nextState) {
            const activatedExecution = [...nextState.playerB.activeExecutions]
              .reverse()
              .find((entity) => entity.card.id === playDecision.cardId);
            setActiveAttackerId(activatedExecution?.instanceId ?? null);
          }

          await sleep(OPPONENT_STEP_DELAY_MS);
          setActiveAttackerId(null);
          setIsAnimating(false);
          return;
        }

        setIsAnimating(true);
        await sleep(500);
        applyTransition((state) => GameEngine.nextPhase(state));
        setIsAnimating(false);
        return;
      }

      if (gameState.phase === "BATTLE") {
        const attackDecision = strategy.chooseAttack(gameState, opponentId);
        if (!attackDecision) {
          setIsAnimating(true);
          await sleep(500);
          const nextState = applyTransition((state) => GameEngine.nextPhase(state));
          setIsAnimating(false);
          if (nextState && nextState.activePlayerId === nextState.playerA.id) {
            clearSelection();
            clearError();
          }
          return;
        }

        setIsAnimating(true);
        setActiveAttackerId(attackDecision.attackerInstanceId);

        const targetEntity = attackDecision.defenderInstanceId
          ? gameState.playerA.activeEntities.find((entity) => entity.instanceId === attackDecision.defenderInstanceId) ?? null
          : null;

        if (targetEntity && (targetEntity.mode === "SET" || targetEntity.mode === "DEFENSE")) {
          setRevealedEntities((previous) => [...previous, targetEntity.instanceId]);
        }

        await sleep(OPPONENT_ATTACK_WINDUP_MS);
        const nextState = applyTransition((state) =>
          GameEngine.executeAttack(
            state,
            opponentId,
            attackDecision.attackerInstanceId,
            attackDecision.defenderInstanceId,
          ),
        );

        if (targetEntity) {
          setRevealedEntities((previous) => previous.filter((id) => id !== targetEntity.instanceId));
        }

        setActiveAttackerId(null);
        setIsAnimating(false);

        if (nextState && nextState.activePlayerId === nextState.playerA.id) {
          clearSelection();
          clearError();
        }
      }
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [
    applyTransition,
    clearError,
    clearSelection,
    gameState,
    isAnimating,
    setActiveAttackerId,
    setIsAnimating,
    setRevealedEntities,
    strategy,
  ]);
}
