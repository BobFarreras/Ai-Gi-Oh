// src/services/olympus/create-olympus-initial-state.ts - Crea el estado inicial de Olimpo con el barajado canónico compartido.
import { ICard } from "@/core/entities/ICard";
import { IOlympusLegend } from "@/core/entities/olympus/IOlympus";
import { IOlympusChampionBattleProfile } from "@/core/services/olympus/resolve-champion-battle-profile";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { shuffleWithRandom } from "@/core/services/random/shuffle-with-random";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

const BASE_MAX_ENERGY = 10;

interface ICreateOlympusInitialStateInput {
  playerId: string;
  championName: string;
  championDeck: ICard[];
  championFusionDeck: ICard[];
  profile: IOlympusChampionBattleProfile;
  legend: IOlympusLegend;
  legendDeck: ICard[];
  legendFusionDeck: ICard[];
  seed: string;
}

function shuffledCards(deck: ICard[], seed: string): ICard[] {
  return shuffleWithRandom(deck, createSeededRandom(seed)).map((card) => ({ ...card }));
}

/**
 * Reparte cuatro cartas y sortea el iniciador desde la seed firmada, igual que el resto del PvE.
 * El motor comparte LP máximos y energía entre ambos lados, así que las asimetrías declaradas por el
 * campeón y la leyenda se aplican después sobre cada jugador.
 */
export function createOlympusInitialState(input: ICreateOlympusInitialStateInput) {
  const championLp = input.profile.startingLp;
  const legendLp = input.legend.startingLp;
  const state = createInitialGameState({
    playerA: {
      id: input.playerId,
      name: input.championName,
      deck: shuffledCards(input.championDeck, `${input.seed}:player-deck`),
      fusionDeck: input.championFusionDeck,
      startingHealthPoints: championLp,
    },
    playerB: {
      id: input.legend.id,
      name: input.legend.displayName,
      deck: shuffledCards(input.legendDeck, `${input.seed}:opponent-deck`),
      fusionDeck: input.legendFusionDeck,
      startingHealthPoints: legendLp,
    },
    openingHandSize: 4,
    maxHealthPoints: Math.max(championLp, legendLp),
    randomSource: createSeededRandom(`${input.seed}:starter`),
    idFactory: createSeededGameEngineIdFactory(input.seed),
  });
  const championEnergy = BASE_MAX_ENERGY + input.profile.energyBonus;
  const legendEnergy = BASE_MAX_ENERGY + input.legend.energyBonus;
  return {
    ...state,
    playerA: {
      ...state.playerA,
      maxHealthPoints: championLp,
      currentEnergy: championEnergy,
      maxEnergy: championEnergy,
    },
    playerB: {
      ...state.playerB,
      maxHealthPoints: legendLp,
      currentEnergy: legendEnergy,
      maxEnergy: legendEnergy,
    },
  };
}
