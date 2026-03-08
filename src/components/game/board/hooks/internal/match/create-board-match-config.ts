// src/components/game/board/hooks/internal/match/create-board-match-config.ts - Construye configuración de partida local por modo para evitar hardcodes en la UI.
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { createMatchSeed } from "@/core/services/random/create-match-seed";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { createDefaultFusionDeck, createPlayerDeckA, createPlayerDeckB, shuffleDeck } from "../initialDeckFactory";

interface IBoardPlayerConfig {
  id: string;
  name: string;
  deck: ICard[];
  fusionDeck: ICard[];
}

export interface IBoardMatchConfig {
  mode: IMatchMode;
  seed: string;
  openingHandSize: number;
  starterPlayerId: string;
  playerA: IBoardPlayerConfig;
  playerB: IBoardPlayerConfig;
  randomSource: () => number;
}

interface ICreateBoardMatchConfigInput {
  mode?: IMatchMode;
  seed?: string;
  playerDeck?: ICard[] | null;
  playerFusionDeck?: ICard[] | null;
  opponentDeck?: ICard[] | null;
  opponentFusionDeck?: ICard[] | null;
  playerId?: string;
  playerName?: string;
  opponentId?: string;
  opponentName?: string;
  starterPlayerId?: string;
  openingHandSize?: number;
}

function resolveModeDefaults(mode: IMatchMode): Omit<IBoardMatchConfig, "seed" | "playerA" | "playerB" | "randomSource"> {
  switch (mode) {
    case "STORY":
      return { mode, openingHandSize: 4, starterPlayerId: "player-local" };
    case "TUTORIAL":
      return { mode, openingHandSize: 4, starterPlayerId: "player-local" };
    case "MULTIPLAYER":
      return { mode, openingHandSize: 4, starterPlayerId: "player-local" };
    case "TRAINING":
    default:
      return { mode: "TRAINING", openingHandSize: 4, starterPlayerId: "player-local" };
  }
}

export function createBoardMatchConfig(input?: ICreateBoardMatchConfigInput): IBoardMatchConfig {
  const mode = input?.mode ?? "TRAINING";
  const defaults = resolveModeDefaults(mode);
  const seed = input?.seed ?? createMatchSeed();
  const randomSource = createSeededRandom(seed);
  const playerId = input?.playerId ?? "player-local";
  const opponentId = input?.opponentId ?? "opponent-local";
  const playerName = input?.playerName ?? "Arquitecto";
  const opponentName = input?.opponentName ?? "Rival Nexus";

  const playerDeckBase = input?.playerDeck && input.playerDeck.length > 0 ? input.playerDeck : createPlayerDeckA(randomSource);
  const playerFusionDeckBase =
    input?.playerFusionDeck && input.playerFusionDeck.length > 0 ? input.playerFusionDeck : createDefaultFusionDeck();
  const opponentDeckBase = input?.opponentDeck && input.opponentDeck.length > 0 ? input.opponentDeck : createPlayerDeckB(randomSource);
  const opponentFusionDeckBase =
    input?.opponentFusionDeck && input.opponentFusionDeck.length > 0 ? input.opponentFusionDeck : createDefaultFusionDeck();

  return {
    mode: defaults.mode,
    seed,
    openingHandSize: input?.openingHandSize ?? defaults.openingHandSize,
    starterPlayerId: input?.starterPlayerId ?? defaults.starterPlayerId,
    playerA: {
      id: playerId,
      name: playerName,
      deck: shuffleDeck(playerDeckBase.map((card) => ({ ...card })), randomSource),
      fusionDeck: playerFusionDeckBase.map((card) => ({ ...card })),
    },
    playerB: {
      id: opponentId,
      name: opponentName,
      deck: shuffleDeck(opponentDeckBase.map((card) => ({ ...card })), randomSource),
      fusionDeck: opponentFusionDeckBase.map((card) => ({ ...card })),
    },
    randomSource,
  };
}
