// src/core/use-cases/game-engine/state/apply-skill-bonuses.ts - Aplica bonus de combate del árbol de habilidades (LP/energía) a un lado del estado.
import { GameState } from "./types";

/**
 * Bonus de combate (ficha 8) para un lado del tablero. Idéntico para jugador y oponente: el bonus de LP sube
 * vida (actual + máxima), el de energía sube el techo (y la energía actual), y el de turno 1 se concede ya si
 * ese lado ARRANCA (por encima del tope) o se difiere a su primer turno si no (determinista → correcto en
 * replay autoritativo y en multijugador).
 */
export function applySkillBonusesToSide(
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
