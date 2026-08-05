// src/services/survival/create-survival-initial-state.ts - Crea el estado inicial Survival con el mismo barajado canónico del Board.
import { ICard } from "@/core/entities/ICard";
import { ISurvivalEncounter, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { shuffleWithRandom } from "@/core/services/random/shuffle-with-random";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { applySkillBonusesToSide } from "@/core/use-cases/game-engine/state/apply-skill-bonuses";
import { IPlayerCombatModifiers } from "@/services/progression/get-player-combat-modifiers";

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
  /** Bonus de combate del árbol de habilidades (ficha 8) del jugador, aplicados sobre su lado del snapshot. */
  playerCombatModifiers?: IPlayerCombatModifiers;
}

function shuffledCards(deck: ICard[], seed: string): ICard[] {
  return shuffleWithRandom(deck, createSeededRandom(seed)).map((card) => ({ ...card }));
}

/** Reparte cuatro cartas y sortea el iniciador desde la seed firmada, igual que el runtime PvE. */
export function createSurvivalInitialState(input: ICreateSurvivalInitialStateInput) {
  let state = createInitialGameState({
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
  // Bonus de combate del árbol de habilidades (ficha 8) SOLO para el jugador, dentro del snapshot firmado:
  // el servidor reproducirá este mismo estado, así que ambos lados aplican los mismos valores.
  // El bonus de LP ya forma parte de run.maxLp desde el inicio de la expedición. No se suma aquí otra vez:
  // así snapshot, vida persistente y validación ending_lp <= max_lp comparten una única fuente autoritativa.
  const modifiers = input.playerCombatModifiers ?? EMPTY_COMBAT_MODIFIERS;
  state = applySkillBonusesToSide(
    state,
    "playerA",
    0,
    Math.max(0, Math.floor(modifiers.maxEnergyBonus)),
    Math.max(0, Math.floor(modifiers.turn1EnergyBonus)),
  );
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

const EMPTY_COMBAT_MODIFIERS: IPlayerCombatModifiers = { startingLpBonus: 0, maxEnergyBonus: 0, turn1EnergyBonus: 0, openingHandBonus: 0, openingMulligan: false };
