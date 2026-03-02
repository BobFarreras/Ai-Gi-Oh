import { BattleMode, IBoardEntity, IPlayer } from "../../entities/IPlayer";
import { GameRuleError } from "../../errors/GameRuleError";
import { NotFoundError } from "../../errors/NotFoundError";
import { ValidationError } from "../../errors/ValidationError";
import { GameState } from "./types";
import { getPlayerPair } from "./player-utils";

function validateEntityPlay(state: GameState, player: IPlayer, mode: BattleMode): void {
  if (state.hasNormalSummonedThisTurn) {
    throw new GameRuleError("Ya has invocado una entidad este turno.");
  }

  if (player.activeEntities.length >= 3) {
    throw new ValidationError("Tu zona de entidades está llena.");
  }

  if (mode !== "ATTACK" && mode !== "DEFENSE") {
    throw new ValidationError("Modo inválido para una entidad.");
  }
}

function validateExecutionPlay(player: IPlayer, mode: BattleMode): void {
  if (player.activeExecutions.length >= 3) {
    throw new ValidationError("Tu zona de ejecuciones está llena.");
  }

  if (mode !== "ACTIVATE" && mode !== "SET") {
    throw new ValidationError("Modo inválido para una ejecución.");
  }
}

function createBoardEntity(card: IPlayer["hand"][number], mode: BattleMode): IBoardEntity {
  return {
    instanceId: `${card.id}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    card,
    mode,
    hasAttackedThisTurn: false,
    isNewlySummoned: true,
  };
}

export function playCard(state: GameState, playerId: string, cardId: string, mode: BattleMode): GameState {
  if (state.pendingTurnAction) {
    throw new GameRuleError("Debes resolver la acción obligatoria de inicio de turno antes de jugar cartas.");
  }

  if (state.activePlayerId !== playerId) {
    throw new GameRuleError("No es tu turno.");
  }

  if (state.phase !== "MAIN_1") {
    throw new GameRuleError("Solo puedes jugar cartas en la fase de despliegue.");
  }

  const { player, opponent, isPlayerA } = getPlayerPair(state, playerId);
  const cardIndex = player.hand.findIndex((card) => card.id === cardId);

  if (cardIndex === -1) {
    throw new NotFoundError("La carta no está en la mano.");
  }

  const card = player.hand[cardIndex];

  if (player.currentEnergy < card.cost) {
    throw new ValidationError("Energía insuficiente.");
  }

  if (card.type === "ENTITY") {
    validateEntityPlay(state, player, mode);
  } else if (card.type === "EXECUTION") {
    validateExecutionPlay(player, mode);
  }

  const boardEntity = createBoardEntity(card, mode);
  const updatedPlayer: IPlayer = {
    ...player,
    currentEnergy: player.currentEnergy - card.cost,
    hand: player.hand.filter((_, index) => index !== cardIndex),
    activeEntities: card.type === "ENTITY" ? [...player.activeEntities, boardEntity] : player.activeEntities,
    activeExecutions: card.type === "EXECUTION" ? [...player.activeExecutions, boardEntity] : player.activeExecutions,
  };

  return {
    ...state,
    hasNormalSummonedThisTurn: card.type === "ENTITY" ? true : state.hasNormalSummonedThisTurn,
    playerA: isPlayerA ? updatedPlayer : opponent,
    playerB: isPlayerA ? opponent : updatedPlayer,
  };
}
