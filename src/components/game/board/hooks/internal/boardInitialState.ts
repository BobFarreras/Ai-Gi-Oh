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
   * Modificadores de COMBATE del árbol de habilidades (ficha 8), aplicados SOLO al jugador local (playerA)
   * en modos PvE. El rival nunca los recibe. Se aplican tras crear el estado base (createInitialGameState los
   * repartiría a ambos jugadores).
   */
  playerStartingLpBonus?: number;
  playerMaxEnergyBonus?: number;
}

export function createInitialBoardState(input?: ICreateInitialBoardStateInput): GameState {
  const matchConfig = createBoardMatchConfig(input);
  const baseState = GameEngine.createInitialGameState({
    playerA: {
      id: matchConfig.playerA.id,
      name: matchConfig.playerA.name,
      deck: matchConfig.playerA.deck,
      fusionDeck: matchConfig.playerA.fusionDeck,
    },
    playerB: {
      id: matchConfig.playerB.id,
      name: matchConfig.playerB.name,
      deck: matchConfig.playerB.deck,
      fusionDeck: matchConfig.playerB.fusionDeck,
    },
    starterPlayerId: matchConfig.starterPlayerId,
    openingHandSize: matchConfig.openingHandSize,
    randomSource: matchConfig.randomSource,
    idFactory: input?.idFactory,
  });

  const lpBonus = Math.max(0, Math.floor(input?.playerStartingLpBonus ?? 0));
  const energyBonus = Math.max(0, Math.floor(input?.playerMaxEnergyBonus ?? 0));
  if (lpBonus === 0 && energyBonus === 0) return baseState;
  const a = baseState.playerA;
  return {
    ...baseState,
    playerA: {
      ...a,
      maxHealthPoints: a.maxHealthPoints + lpBonus,
      healthPoints: a.healthPoints + lpBonus,
      maxEnergy: a.maxEnergy + energyBonus,
      currentEnergy: a.currentEnergy + energyBonus,
    },
  };
}
