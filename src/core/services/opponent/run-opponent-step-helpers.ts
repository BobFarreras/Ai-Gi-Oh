// src/core/services/opponent/run-opponent-step-helpers.ts - Helpers de descarte, pendientes y activación para mantener runOpponentStep cohesivo.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { pickPendingFusionMaterialInstanceId } from "@/core/services/opponent/opponent-pending-fusion-material";
import { canActivateExecutionNow } from "@/core/services/opponent/select-opponent-play";
import { getFusionRecipeByResultId } from "@/core/use-cases/game-engine/fusion/fusion-recipes";
import { GameState } from "@/core/use-cases/GameEngine";

function getPlayerPairById(state: GameState, playerId: string): { player: IPlayer; opponent: IPlayer } {
  return state.playerA.id === playerId
    ? { player: state.playerA, opponent: state.playerB }
    : { player: state.playerB, opponent: state.playerA };
}

function scoreCardForDiscard(card: ICard, player: IPlayer): number {
  if (card.type === "ENTITY") {
    let score = (card.attack ?? 0) + (card.defense ?? 0) - card.cost * 180;
    const isFusionMaterialCandidate = player.hand.some((handCard) => {
      if (handCard.type !== "EXECUTION" || handCard.effect?.action !== "FUSION_SUMMON") return false;
      const recipe = getFusionRecipeByResultId(handCard.effect.recipeId);
      if (!recipe) return false;
      return Boolean(recipe.requiredMaterialIds?.includes(card.id) || (card.archetype && recipe.requiredArchetypes?.includes(card.archetype)));
    });
    if (isFusionMaterialCandidate) score += 1200;
    return score;
  }

  let effectValue = card.effect && "value" in card.effect && typeof card.effect.value === "number" ? card.effect.value : 0;
  if (card.type === "EXECUTION" && card.effect?.action === "FUSION_SUMMON") {
    const hasFusionCard = player.fusionDeck?.some((fusionCard) => fusionCard.id === card.effect.recipeId) ?? false;
    effectValue += hasFusionCard ? 1800 : 600;
  }
  return effectValue - card.cost * 140;
}

function chooseCardToDiscard(hand: ICard[], player: IPlayer): ICard | null {
  if (hand.length === 0) return null;
  return hand.reduce((worst, current) =>
    (scoreCardForDiscard(current, player) < scoreCardForDiscard(worst, player) ? current : worst));
}

export function pickPendingSelectionId(state: GameState, opponentId: string): string | null {
  if (!state.pendingTurnAction || state.pendingTurnAction.playerId !== opponentId) return null;
  const { player, opponent } = getPlayerPairById(state, opponentId);

  if (state.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT") return chooseCardToDiscard(player.hand, player)?.id ?? null;
  if (state.pendingTurnAction.type === "SELECT_FUSION_MATERIALS") {
    const pending = state.pendingTurnAction;
    return pickPendingFusionMaterialInstanceId({
      activeEntities: player.activeEntities,
      selectedMaterialInstanceIds: pending.selectedMaterialInstanceIds,
      recipeId: pending.fusionFromExecutionRecipeId ?? pending.fusionCardId,
    });
  }
  if (state.pendingTurnAction.type === "SELECT_GRAVEYARD_CARD") {
    const cardType = state.pendingTurnAction.cardType;
    const selected = [...player.graveyard].reverse().find((card) => !cardType || card.type === cardType);
    return selected ? selected.runtimeId ?? selected.id : null;
  }
  if (state.pendingTurnAction.type === "SELECT_OPPONENT_GRAVEYARD_CARD") {
    const cardType = state.pendingTurnAction.cardType;
    const selected = [...opponent.graveyard].reverse().find((card) => !cardType || card.type === cardType);
    return selected ? selected.runtimeId ?? selected.id : null;
  }
  if (state.pendingTurnAction.type === "SELECT_OPPONENT_SET_CARD") {
    const zone = state.pendingTurnAction.zone;
    const setEntities = zone !== "EXECUTIONS" ? opponent.activeEntities.filter((entity) => entity.mode === "SET") : [];
    const setExecutions = zone !== "ENTITIES" ? opponent.activeExecutions.filter((entity) => entity.mode === "SET") : [];
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
  const { player, opponent } = getPlayerPairById(state, opponentId);
  const activatable = player.activeExecutions.find((entity) =>
    entity.mode === "SET" && canActivateExecutionNow(entity.card, player, opponent));
  return activatable?.instanceId ?? null;
}
