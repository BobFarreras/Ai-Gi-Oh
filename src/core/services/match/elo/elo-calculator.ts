// src/core/services/match/elo/elo-calculator.ts - Cálculo estándar de ELO para partidas multijugador.

const K = 32;
const ELO_FLOOR = 100;

type MatchResult = "WIN" | "LOSE" | "DRAW";

function expectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

function actualScore(result: MatchResult): number {
  if (result === "WIN") return 1;
  if (result === "LOSE") return 0;
  return 0.5;
}

export function calculateNewElo(playerRating: number, opponentRating: number, result: MatchResult): number {
  const E = expectedScore(playerRating, opponentRating);
  const S = actualScore(result);
  return Math.max(ELO_FLOOR, Math.round(playerRating + K * (S - E)));
}

export function calculateEloForBothPlayers(
  winnerRating: number,
  loserRating: number,
): { winnerNewElo: number; loserNewElo: number } {
  return {
    winnerNewElo: calculateNewElo(winnerRating, loserRating, "WIN"),
    loserNewElo: calculateNewElo(loserRating, winnerRating, "LOSE"),
  };
}

export function calculateEloForDraw(
  playerARating: number,
  playerBRating: number,
): { playerANewElo: number; playerBNewElo: number } {
  return {
    playerANewElo: calculateNewElo(playerARating, playerBRating, "DRAW"),
    playerBNewElo: calculateNewElo(playerBRating, playerARating, "DRAW"),
  };
}
