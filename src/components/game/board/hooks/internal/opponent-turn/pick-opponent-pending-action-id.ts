// src/components/game/board/hooks/internal/opponent-turn/pick-opponent-pending-action-id.ts - Resuelve selección automática robusta para acciones pendientes del rival.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { IOpponentAutoPick, IOpponentTurnContext } from "./types";

function scoreSetCardThreat(entity: IBoardEntity): number {
  const attack = entity.card.attack ?? 0;
  const defense = entity.card.defense ?? 0;
  const body = attack + defense;
  if (entity.card.type === "TRAP") return body + 1200 + entity.card.cost * 80;
  if (entity.card.type === "EXECUTION") return body + 900 + entity.card.cost * 70;
  return body + entity.card.cost * 60;
}

function pickLatestOwnGraveyardCard(graveyard: ICard[], cardType?: ICard["type"]): string | null {
  const candidate = [...graveyard].reverse().find((card) => !cardType || card.type === cardType);
  return candidate ? candidate.runtimeId ?? candidate.id : null;
}

function pickLatestOpponentGraveyardCard(graveyard: ICard[], cardType?: ICard["type"]): string | null {
  const candidate = [...graveyard].reverse().find((card) => !cardType || card.type === cardType);
  return candidate ? candidate.runtimeId ?? candidate.id : null;
}

function pickBestOpponentSetCard(context: IOpponentTurnContext, zone: "ENTITIES" | "EXECUTIONS" | "ANY"): string | null {
  const { gameState } = context;
  const fromEntities = zone !== "EXECUTIONS" ? gameState.playerA.activeEntities.filter((entity) => entity.mode === "SET") : [];
  const fromExecutions = zone !== "ENTITIES" ? gameState.playerA.activeExecutions.filter((entity) => entity.mode === "SET") : [];
  const candidates = [...fromEntities, ...fromExecutions];
  if (candidates.length === 0) return null;
  const best = candidates.reduce((selected, current) =>
    scoreSetCardThreat(current) > scoreSetCardThreat(selected) ? current : selected);
  return best.instanceId;
}

/** Selecciona automáticamente el ID a resolver para la acción obligatoria actual del oponente. */
export function pickOpponentPendingActionId(context: IOpponentTurnContext, autoPick: IOpponentAutoPick): string | null {
  const { gameState } = context;
  if (!gameState.pendingTurnAction || gameState.pendingTurnAction.playerId !== gameState.playerB.id) return null;
  if (gameState.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT") return autoPick.chooseCardToDiscard(gameState.playerB.hand)?.id ?? null;
  if (gameState.pendingTurnAction.type === "SELECT_FUSION_MATERIALS") {
    const pending = gameState.pendingTurnAction;
    return gameState.playerB.activeEntities.find((entity) => !pending.selectedMaterialInstanceIds.includes(entity.instanceId))?.instanceId ?? null;
  }
  if (gameState.pendingTurnAction.type === "SELECT_GRAVEYARD_CARD") {
    return pickLatestOwnGraveyardCard(gameState.playerB.graveyard, gameState.pendingTurnAction.cardType);
  }
  if (gameState.pendingTurnAction.type === "SELECT_OPPONENT_GRAVEYARD_CARD") {
    return pickLatestOpponentGraveyardCard(gameState.playerA.graveyard, gameState.pendingTurnAction.cardType);
  }
  if (gameState.pendingTurnAction.type === "SELECT_OPPONENT_SET_CARD") {
    return pickBestOpponentSetCard(context, gameState.pendingTurnAction.zone);
  }
  return null;
}
