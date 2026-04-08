// src/core/services/opponent/run-opponent-step-helpers.ts - Helpers de descarte, pendientes y activación para mantener runOpponentStep cohesivo.
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { canActivateExecutionNow } from "@/core/services/opponent/select-opponent-play";
import { pickPendingFusionMaterialInstanceId } from "@/core/services/opponent/opponent-pending-fusion-material";

function scoreCardForDiscard(card: ICard): number {
  if (card.type === "ENTITY") {
    return (card.attack ?? 0) + (card.defense ?? 0) - card.cost * 180;
  }
  const effectValue = card.effect && "value" in card.effect && typeof card.effect.value === "number" ? card.effect.value : 0;
  return effectValue - card.cost * 140;
}

function chooseCardToDiscard(hand: ICard[]): ICard | null {
  if (hand.length === 0) return null;
  return hand.reduce((worst, current) => (scoreCardForDiscard(current) < scoreCardForDiscard(worst) ? current : worst));
}

export function pickPendingSelectionId(state: GameState, opponentId: string): string | null {
  if (!state.pendingTurnAction || state.pendingTurnAction.playerId !== opponentId) return null;
  if (state.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT") return chooseCardToDiscard(state.playerB.hand)?.id ?? null;
  if (state.pendingTurnAction.type === "SELECT_FUSION_MATERIALS") {
    const pending = state.pendingTurnAction;
    return pickPendingFusionMaterialInstanceId({
      activeEntities: state.playerB.activeEntities,
      selectedMaterialInstanceIds: pending.selectedMaterialInstanceIds,
      recipeId: pending.fusionFromExecutionRecipeId ?? pending.fusionCardId,
    });
  }
  if (state.pendingTurnAction.type === "SELECT_GRAVEYARD_CARD") {
    const cardType = state.pendingTurnAction.cardType;
    const selected = [...state.playerB.graveyard].reverse().find((card) => !cardType || card.type === cardType);
    return selected ? selected.runtimeId ?? selected.id : null;
  }
  if (state.pendingTurnAction.type === "SELECT_OPPONENT_GRAVEYARD_CARD") {
    const cardType = state.pendingTurnAction.cardType;
    const selected = [...state.playerA.graveyard].reverse().find((card) => !cardType || card.type === cardType);
    return selected ? selected.runtimeId ?? selected.id : null;
  }
  if (state.pendingTurnAction.type === "SELECT_OPPONENT_SET_CARD") {
    const zone = state.pendingTurnAction.zone;
    const setEntities = zone !== "EXECUTIONS" ? state.playerA.activeEntities.filter((entity) => entity.mode === "SET") : [];
    const setExecutions = zone !== "ENTITIES" ? state.playerA.activeExecutions.filter((entity) => entity.mode === "SET") : [];
    const candidates = [...setEntities, ...setExecutions];
    if (candidates.length === 0) return null;
    const best = candidates.reduce((selected, current) => {
      const selectedScore = (selected.card.attack ?? 0) + (selected.card.defense ?? 0) + selected.card.cost * 80;
      const currentScore = (current.card.attack ?? 0) + (current.card.defense ?? 0) + current.card.cost * 80;
      return currentScore > selectedScore ? current : selected;
    });
    return best.instanceId;
  }
  return null;
}

/** Detecta ejecuciones seteadas que ya pueden cambiar a ACTIVATE en MAIN_1. */
export function findActivatableSetExecutionInstanceId(state: GameState, opponentId: string): string | null {
  const { player, opponent } = state.playerA.id === opponentId
    ? { player: state.playerA, opponent: state.playerB }
    : { player: state.playerB, opponent: state.playerA };
  const activatable = player.activeExecutions.find((entity) =>
    entity.mode === "SET" && canActivateExecutionNow(entity.card, player, opponent));
  return activatable?.instanceId ?? null;
}
