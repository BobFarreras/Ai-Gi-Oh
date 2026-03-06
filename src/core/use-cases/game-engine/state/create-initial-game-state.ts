// src/core/use-cases/game-engine/state/create-initial-game-state.ts - Crea estado inicial con mazos y asigna runtimeId único a cada copia de carta.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { GameState } from "./types";

interface IInitialPlayerConfig {
  id: string;
  name: string;
  deck: ICard[];
}

interface ICreateInitialGameStateConfig {
  playerA: IInitialPlayerConfig;
  playerB: IInitialPlayerConfig;
  openingHandSize?: number;
  maxHealthPoints?: number;
  maxEnergy?: number;
  starterPlayerId?: string;
}

function createPlayer(config: IInitialPlayerConfig, maxHealthPoints: number, maxEnergy: number): IPlayer {
  const deckWithRuntimeIds = config.deck.map((card, index) => ({
    ...card,
    runtimeId: card.runtimeId ?? `${config.id}-${card.id}-${index}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }));
  return {
    id: config.id,
    name: config.name,
    healthPoints: maxHealthPoints,
    maxHealthPoints,
    currentEnergy: maxEnergy,
    maxEnergy,
    deck: deckWithRuntimeIds,
    hand: [],
    graveyard: [],
    activeEntities: [],
    activeExecutions: [],
  };
}

function drawOpeningHand(player: IPlayer, openingHandSize: number): IPlayer {
  const cardsToDraw = Math.max(0, Math.min(openingHandSize, player.deck.length));

  if (cardsToDraw === 0) {
    return player;
  }

  return {
    ...player,
    hand: player.deck.slice(0, cardsToDraw),
    deck: player.deck.slice(cardsToDraw),
  };
}

function resolveStartingPlayerId(config: ICreateInitialGameStateConfig): string {
  if (config.starterPlayerId) {
    return config.starterPlayerId;
  }

  return Math.random() < 0.5 ? config.playerA.id : config.playerB.id;
}

export function createInitialGameState(config: ICreateInitialGameStateConfig): GameState {
  const openingHandSize = config.openingHandSize ?? 3;
  const maxHealthPoints = config.maxHealthPoints ?? 8000;
  const maxEnergy = config.maxEnergy ?? 10;
  const startingPlayerId = resolveStartingPlayerId(config);

  const playerA = drawOpeningHand(createPlayer(config.playerA, maxHealthPoints, maxEnergy), openingHandSize);
  const playerB = drawOpeningHand(createPlayer(config.playerB, maxHealthPoints, maxEnergy), openingHandSize);

  return {
    playerA,
    playerB,
    activePlayerId: startingPlayerId,
    startingPlayerId,
    turn: 1,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}
