// src/core/use-cases/game-engine/state/create-initial-game-state.ts - Crea estado inicial con mazos y asigna runtimeId único a cada copia de carta.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { RandomSource } from "@/core/services/random/seeded-rng";
import type { IGameEngineIdFactory } from "./id-factory";
import { GameState } from "./types";

interface IInitialPlayerConfig {
  id: string;
  name: string;
  deck: ICard[];
  fusionDeck?: ICard[];
}

interface ICreateInitialGameStateConfig {
  playerA: IInitialPlayerConfig;
  playerB: IInitialPlayerConfig;
  openingHandSize?: number;
  maxHealthPoints?: number;
  maxEnergy?: number;
  starterPlayerId?: string;
  randomSource?: RandomSource;
  idFactory?: IGameEngineIdFactory;
}

function createRuntimeId(config: IInitialPlayerConfig, card: ICard, index: number, randomSource: RandomSource): string {
  const randomSuffix = Math.floor(randomSource() * 1_000_000_000)
    .toString(36)
    .padStart(6, "0");
  return `${config.id}-${card.id}-${index}-${randomSuffix}`;
}

function createPlayer(config: IInitialPlayerConfig, maxHealthPoints: number, maxEnergy: number, randomSource: RandomSource): IPlayer {
  const deckWithRuntimeIds = config.deck.map((card, index) => ({
    ...card,
    runtimeId: card.runtimeId ?? createRuntimeId(config, card, index, randomSource),
  }));
  return {
    id: config.id,
    name: config.name,
    healthPoints: maxHealthPoints,
    maxHealthPoints,
    currentEnergy: maxEnergy,
    maxEnergy,
    deck: deckWithRuntimeIds,
    fusionDeck: (config.fusionDeck ?? []).map((card) => ({ ...card })),
    hand: [],
    graveyard: [],
    destroyedPile: [],
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

function resolveStartingPlayerId(config: ICreateInitialGameStateConfig, randomSource: RandomSource): string {
  if (config.starterPlayerId) {
    return config.starterPlayerId;
  }

  return randomSource() < 0.5 ? config.playerA.id : config.playerB.id;
}

export function createInitialGameState(config: ICreateInitialGameStateConfig): GameState {
  const openingHandSize = config.openingHandSize ?? 3;
  const maxHealthPoints = config.maxHealthPoints ?? 8000;
  const maxEnergy = config.maxEnergy ?? 10;
  const randomSource = config.randomSource ?? Math.random;
  const startingPlayerId = resolveStartingPlayerId(config, randomSource);

  const playerA = drawOpeningHand(createPlayer(config.playerA, maxHealthPoints, maxEnergy, randomSource), openingHandSize);
  const playerB = drawOpeningHand(createPlayer(config.playerB, maxHealthPoints, maxEnergy, randomSource), openingHandSize);

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
    idFactory: config.idFactory,
  };
}
