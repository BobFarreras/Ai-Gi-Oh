// src/services/survival/create-survival-initial-state.ts - Crea el estado inicial Survival con el mismo barajado canónico del Board.
import { ICard } from "@/core/entities/ICard";
import { ISurvivalEncounter, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { shuffleWithRandom } from "@/core/services/random/shuffle-with-random";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

interface ICreateSurvivalInitialStateInput {
  playerId: string;
  playerDeck: ICard[];
  playerFusionDeck: ICard[];
  opponentName: string;
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  run: ISurvivalRun;
  encounter: ISurvivalEncounter;
  seed: string;
}

function shuffledCards(deck: ICard[], seed: string): ICard[] {
  return shuffleWithRandom(deck, createSeededRandom(seed)).map((card) => ({ ...card }));
}

/** Reparte cuatro cartas y sortea el iniciador desde la seed firmada, igual que el runtime PvE. */
export function createSurvivalInitialState(input: ICreateSurvivalInitialStateInput) {
  const state = createInitialGameState({
    playerA: {
      id: input.playerId,
      name: "Arquitecto",
      deck: shuffledCards(input.playerDeck, `${input.seed}:player-deck`),
      fusionDeck: input.playerFusionDeck,
      startingHealthPoints: input.run.currentLp,
    },
    playerB: {
      id: input.encounter.opponentId,
      name: input.opponentName,
      deck: shuffledCards(input.opponentDeck, `${input.seed}:opponent-deck`),
      fusionDeck: input.opponentFusionDeck,
    },
    openingHandSize: 4,
    maxHealthPoints: input.run.maxLp,
    randomSource: createSeededRandom(`${input.seed}:starter`),
    idFactory: createSeededGameEngineIdFactory(input.seed),
  });
  if (input.encounter.maxLpBonus <= 0) return state;
  return {
    ...state,
    playerB: {
      ...state.playerB,
      healthPoints: state.playerB.healthPoints + input.encounter.maxLpBonus,
      maxHealthPoints: state.playerB.maxHealthPoints + input.encounter.maxLpBonus,
    },
  };
}
