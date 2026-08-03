// src/components/game/board/hooks/internal/boardInitialState.ts - Construye estado inicial del tablero con mazo persistido opcional.
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { IGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { createBoardMatchConfig } from "./match/create-board-match-config";

export interface ICreateInitialBoardStateInput {
  mode?: IMatchMode;
  playerDeck?: ICard[] | null;
  playerFusionDeck?: ICard[] | null;
  opponentDeck?: ICard[] | null;
  opponentFusionDeck?: ICard[] | null;
  seed?: string;
  playerId?: string;
  playerName?: string;
  opponentId?: string;
  opponentName?: string;
  starterPlayerId?: string;
  openingHandSize?: number;
  preserveDeckOrder?: boolean;
  /** Fábrica de ids determinista (multijugador) para instanceId idénticos en ambos clientes. */
  idFactory?: IGameEngineIdFactory;
  /**
   * Modificadores de COMBATE del árbol de habilidades (ficha 8) del jugador local (playerA), en modos PvE. Se
   * aplican tras crear el estado base (createInitialGameState los repartiría a ambos jugadores).
   */
  playerStartingLpBonus?: number;
  /** LP actuales transportados entre combates; no altera el máximo base. */
  playerStartingHealthPoints?: number;
  playerMaxEnergyBonus?: number;
  /** Arranque en Frío (ficha 8): +energía one-time en el primer turno del jugador, por encima del tope. */
  playerTurn1EnergyBonus?: number;
  /**
   * Modificadores de COMBATE asignados al OPONENTE (playerB) desde el admin (habilidades de oponente). Mismo
   * efecto que los del jugador pero sobre el rival: sube su LP inicial, su techo de energía y su energía de
   * turno 1. PvE. 0/ausente = el rival arranca con los valores por defecto.
   */
  opponentStartingLpBonus?: number;
  opponentStartingHealthPoints?: number;
  opponentMaxEnergyBonus?: number;
  opponentTurn1EnergyBonus?: number;
}

/**
 * Aplica los bonus de combate (LP/energía/arranque) a un lado del tablero. Idéntico para jugador y oponente:
 * el bonus de LP sube vida (actual + máxima), el de energía sube el techo (y la energía actual), y el de
 * turno 1 se concede ya si ese lado ARRANCA (por encima del tope) o se difiere a su primer turno si no.
 */
function applySkillBonusesToSide(
  state: GameState,
  side: "playerA" | "playerB",
  lpBonus: number,
  energyBonus: number,
  turn1EnergyBonus: number,
): GameState {
  if (lpBonus === 0 && energyBonus === 0 && turn1EnergyBonus === 0) return state;
  const p = state[side];
  const isStarter = state.activePlayerId === p.id;
  const starterTurn1Energy = isStarter ? turn1EnergyBonus : 0;
  return {
    ...state,
    [side]: {
      ...p,
      maxHealthPoints: p.maxHealthPoints + lpBonus,
      healthPoints: p.healthPoints + lpBonus,
      maxEnergy: p.maxEnergy + energyBonus,
      currentEnergy: p.currentEnergy + energyBonus + starterTurn1Energy,
    },
    firstTurnEnergyBonusByPlayerId:
      !isStarter && turn1EnergyBonus > 0
        ? { ...state.firstTurnEnergyBonusByPlayerId, [p.id]: turn1EnergyBonus }
        : state.firstTurnEnergyBonusByPlayerId,
  };
}

export function createInitialBoardState(input?: ICreateInitialBoardStateInput): GameState {
  const matchConfig = createBoardMatchConfig(input);
  const baseState = GameEngine.createInitialGameState({
    playerA: {
      id: matchConfig.playerA.id,
      name: matchConfig.playerA.name,
      deck: matchConfig.playerA.deck,
      fusionDeck: matchConfig.playerA.fusionDeck,
      startingHealthPoints: input?.playerStartingHealthPoints,
    },
    playerB: {
      id: matchConfig.playerB.id,
      name: matchConfig.playerB.name,
      deck: matchConfig.playerB.deck,
      fusionDeck: matchConfig.playerB.fusionDeck,
      startingHealthPoints: input?.opponentStartingHealthPoints,
    },
    starterPlayerId: matchConfig.starterPlayerId,
    openingHandSize: matchConfig.openingHandSize,
    randomSource: matchConfig.randomSource,
    idFactory: input?.idFactory,
  });

  const playerState = applySkillBonusesToSide(
    baseState,
    "playerA",
    Math.max(0, Math.floor(input?.playerStartingLpBonus ?? 0)),
    Math.max(0, Math.floor(input?.playerMaxEnergyBonus ?? 0)),
    Math.max(0, Math.floor(input?.playerTurn1EnergyBonus ?? 0)),
  );
  return applySkillBonusesToSide(
    playerState,
    "playerB",
    Math.max(0, Math.floor(input?.opponentStartingLpBonus ?? 0)),
    Math.max(0, Math.floor(input?.opponentMaxEnergyBonus ?? 0)),
    Math.max(0, Math.floor(input?.opponentTurn1EnergyBonus ?? 0)),
  );
}
