// src/core/use-cases/game-engine/actions/internal/play-card-resolution.ts - Encapsula validaciones por tipo de carta y armado de estado tras jugarla.
import { CardType, ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { ValidationError } from "@/core/errors/ValidationError";
import { defaultGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function resolveEntityDeployMode(mode: BattleMode): Extract<BattleMode, "ATTACK" | "SET"> {
  if (mode === "ATTACK") return "ATTACK";
  if (mode === "DEFENSE" || mode === "SET") return "SET";
  throw new ValidationError("Modo inválido para una entidad.");
}

function validateCardPlayRules(state: GameState, player: IPlayer, cardType: CardType, mode: BattleMode): BattleMode {
  if (cardType === "ENTITY") {
    if (state.hasNormalSummonedThisTurn) throw new GameRuleError("Ya has invocado una entidad este turno.");
    if (player.activeEntities.length >= 3) throw new ValidationError("Tu zona de entidades está llena.");
    return resolveEntityDeployMode(mode);
  }
  if (cardType === "EXECUTION") {
    if (player.activeExecutions.length >= 3) throw new ValidationError("Tu zona de ejecuciones está llena.");
    if (mode !== "ACTIVATE" && mode !== "SET") throw new ValidationError("Modo inválido para una ejecución.");
    return mode;
  }
  if (cardType === "TRAP") {
    if (player.activeExecutions.length >= 3) throw new ValidationError("Tu zona de ejecuciones está llena.");
    if (mode !== "SET") throw new ValidationError("Modo inválido para una trampa.");
    return mode;
  }
  if (cardType === "FUSION") {
    throw new ValidationError("Las cartas de fusión deben invocarse con materiales desde la acción Fusionar.");
  }
  return mode;
}

/**
 * Valida restricciones por tipo de carta y devuelve el modo real de despliegue.
 */
export function resolveValidatedPlayMode(state: GameState, player: IPlayer, cardType: CardType, requestedMode: BattleMode): BattleMode {
  return validateCardPlayRules(state, player, cardType, requestedMode);
}

/**
 * Crea la entidad de tablero asociada a una carta jugada.
 */
export function createPlayedBoardEntity(state: GameState, card: ICard, mode: BattleMode): IBoardEntity {
  const idFactory = state.idFactory ?? defaultGameEngineIdFactory;
  return {
    instanceId: idFactory.createEntityInstanceId(card.id),
    card,
    mode,
    hasAttackedThisTurn: false,
    isNewlySummoned: true,
  };
}

/**
 * Construye el jugador resultante tras consumir mano/energía y colocar la carta en su zona correspondiente.
 */
export function buildPlayerAfterCardPlay(
  player: IPlayer,
  card: ICard,
  boardEntity: IBoardEntity,
  cardIndex: number,
): IPlayer {
  return {
    ...player,
    currentEnergy: player.currentEnergy - card.cost,
    hand: player.hand.filter((_, index) => index !== cardIndex),
    activeEntities: card.type === "ENTITY" ? [...player.activeEntities, boardEntity] : player.activeEntities,
    activeExecutions: card.type === "EXECUTION" || card.type === "TRAP" ? [...player.activeExecutions, boardEntity] : player.activeExecutions,
  };
}
