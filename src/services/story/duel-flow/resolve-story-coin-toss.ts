// src/services/story/duel-flow/resolve-story-coin-toss.ts - Resuelve quién inicia el duelo Story mediante moneda configurable.
interface IStoryCoinTossInput {
  playerId: string;
  opponentId: string;
  playerStartBonusPercent?: number;
  opponentStartBonusPercent?: number;
  randomValue?: number;
}

export interface IStoryCoinTossResult {
  starterPlayerId: string;
  starterSide: "PLAYER" | "OPPONENT";
  playerStartProbability: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Calcula el iniciador del duelo con base 50/50 y margen para modificadores futuros.
 */
export function resolveStoryCoinToss(input: IStoryCoinTossInput): IStoryCoinTossResult {
  const playerBonus = (input.playerStartBonusPercent ?? 0) / 100;
  const opponentBonus = (input.opponentStartBonusPercent ?? 0) / 100;
  const playerStartProbability = clamp01(0.5 + playerBonus - opponentBonus);
  const randomValue = input.randomValue ?? Math.random();
  const startsPlayer = randomValue < playerStartProbability;
  return {
    starterPlayerId: startsPlayer ? input.playerId : input.opponentId,
    starterSide: startsPlayer ? "PLAYER" : "OPPONENT",
    playerStartProbability,
  };
}
