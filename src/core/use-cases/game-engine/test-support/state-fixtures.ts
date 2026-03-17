// src/core/use-cases/game-engine/test-support/state-fixtures.ts - Helpers compartidos para construir jugadores y estados base en tests del game-engine.
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

interface ICreateTestStateConfig {
  playerA?: Partial<IPlayer>;
  playerB?: Partial<IPlayer>;
  activePlayerId?: string;
  startingPlayerId?: string;
  turn?: number;
  phase?: GameState["phase"];
  hasNormalSummonedThisTurn?: boolean;
  pendingTurnAction?: GameState["pendingTurnAction"];
  combatLog?: GameState["combatLog"];
  idFactory?: GameState["idFactory"];
}

/**
 * Crea un jugador de prueba con valores coherentes y sobreescrituras opcionales por escenario.
 */
export function createTestPlayer(id: string, overrides?: Partial<IPlayer>): IPlayer {
  return {
    id,
    name: id,
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 10,
    maxEnergy: 10,
    deck: [],
    hand: [],
    graveyard: [],
    activeEntities: [],
    activeExecutions: [],
    ...overrides,
  };
}

/**
 * Construye un GameState de prueba reutilizable para minimizar ruido y duplicación en suites.
 */
export function createTestGameState(config?: ICreateTestStateConfig): GameState {
  const resolvedConfig = config ?? {};
  return {
    playerA: createTestPlayer("p1", resolvedConfig.playerA),
    playerB: createTestPlayer("p2", resolvedConfig.playerB),
    activePlayerId: resolvedConfig.activePlayerId ?? "p1",
    startingPlayerId: resolvedConfig.startingPlayerId ?? "p1",
    turn: resolvedConfig.turn ?? 1,
    phase: resolvedConfig.phase ?? "MAIN_1",
    hasNormalSummonedThisTurn: resolvedConfig.hasNormalSummonedThisTurn ?? false,
    pendingTurnAction: resolvedConfig.pendingTurnAction ?? null,
    combatLog: resolvedConfig.combatLog ?? [],
    idFactory: resolvedConfig.idFactory,
  };
}

/**
 * Atajo para crear mazos mínimos de prueba cuando solo se necesita identidad de carta.
 */
export function createDeckCard(id: string): ICard {
  return {
    id,
    name: id,
    description: "Carta de test",
    type: "ENTITY",
    faction: "NEUTRAL",
    cost: 1,
    attack: 1000,
    defense: 1000,
  };
}

/**
 * Fabrica una entidad de tablero de test con configuración mínima y sobrescrituras opcionales.
 */
export function createTestBoardEntity(
  instanceId: string,
  card: ICard,
  mode: BattleMode,
  overrides?: Partial<IBoardEntity>,
): IBoardEntity {
  return {
    instanceId,
    card,
    mode,
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
    ...overrides,
  };
}
