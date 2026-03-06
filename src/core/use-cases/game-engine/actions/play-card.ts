// src/core/use-cases/game-engine/actions/play-card.ts - Juega cartas desde la mano validando reglas de turno, energía y zonas.
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { appendCombatLogEvent } from "@/core/use-cases/game-engine/logging/combat-log";
import { getPlayerPair } from "@/core/use-cases/game-engine/state/player-utils";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function validateEntityPlay(state: GameState, player: IPlayer): void {
  if (state.hasNormalSummonedThisTurn) {
    throw new GameRuleError("Ya has invocado una entidad este turno.");
  }

  if (player.activeEntities.length >= 3) {
    throw new ValidationError("Tu zona de entidades está llena.");
  }
}

function resolveEntityDeployMode(mode: BattleMode): Extract<BattleMode, "ATTACK" | "SET"> {
  if (mode === "ATTACK") {
    return "ATTACK";
  }

  if (mode === "DEFENSE" || mode === "SET") {
    return "SET";
  }

  throw new ValidationError("Modo inválido para una entidad.");
}

function validateExecutionPlay(player: IPlayer, mode: BattleMode): void {
  if (player.activeExecutions.length >= 3) {
    throw new ValidationError("Tu zona de ejecuciones está llena.");
  }

  if (mode !== "ACTIVATE" && mode !== "SET") {
    throw new ValidationError("Modo inválido para una ejecución.");
  }
}

function validateTrapPlay(player: IPlayer, mode: BattleMode): void {
  if (player.activeExecutions.length >= 3) {
    throw new ValidationError("Tu zona de ejecuciones está llena.");
  }

  if (mode !== "SET") {
    throw new ValidationError("Modo inválido para una trampa.");
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

function matchesHandCardReference(card: IPlayer["hand"][number], reference: string): boolean {
  return card.runtimeId === reference || card.id === reference;
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
  const cardIndex = player.hand.findIndex((card) => matchesHandCardReference(card, cardId));

  if (cardIndex === -1) {
    throw new NotFoundError("La carta no está en la mano.");
  }

  const card = player.hand[cardIndex];
  let resolvedMode = mode;

  if (player.currentEnergy < card.cost) {
    throw new ValidationError("Energía insuficiente.");
  }

  if (card.type === "ENTITY") {
    validateEntityPlay(state, player);
    resolvedMode = resolveEntityDeployMode(mode);
  } else if (card.type === "EXECUTION") {
    validateExecutionPlay(player, mode);
  } else if (card.type === "TRAP") {
    validateTrapPlay(player, mode);
  } else if (card.type === "FUSION") {
    throw new ValidationError("Las cartas de fusión deben invocarse con materiales desde la acción Fusionar.");
  }

  const boardEntity = createBoardEntity(card, resolvedMode);
  const updatedPlayer: IPlayer = {
    ...player,
    currentEnergy: player.currentEnergy - card.cost,
    hand: player.hand.filter((_, index) => index !== cardIndex),
    activeEntities: card.type === "ENTITY" ? [...player.activeEntities, boardEntity] : player.activeEntities,
    activeExecutions: card.type === "EXECUTION" || card.type === "TRAP" ? [...player.activeExecutions, boardEntity] : player.activeExecutions,
  };

  const nextState = {
    ...state,
    hasNormalSummonedThisTurn: card.type === "ENTITY" ? true : state.hasNormalSummonedThisTurn,
    playerA: isPlayerA ? updatedPlayer : opponent,
    playerB: isPlayerA ? opponent : updatedPlayer,
  };

  return appendCombatLogEvent(nextState, playerId, "CARD_PLAYED", {
    cardId: card.id,
    cardType: card.type,
    mode: resolvedMode,
  });
}
