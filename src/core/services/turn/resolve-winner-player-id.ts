// src/core/services/turn/resolve-winner-player-id.ts - Resuelve ganador del duelo por KO o límite de turnos con desempate por historial de LP.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { GameState } from "@/core/use-cases/GameEngine";

const DEFAULT_MAX_TURN_LIMIT = 30;

interface ILifePointReplayState {
  current: number;
  max: number;
  final: number;
  firstReachedFinalAt: number | null;
}

function parseTargetedAmount(event: ICombatLogEvent): { targetPlayerId: string; amount: number } | null {
  const targetPlayerId = event.payload.targetPlayerId;
  const amount = event.payload.amount;
  if (typeof targetPlayerId !== "string") return null;
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null;
  return { targetPlayerId, amount };
}

function applyDamage(state: ILifePointReplayState, amount: number): ILifePointReplayState {
  return { ...state, current: Math.max(0, state.current - amount) };
}

function applyHeal(state: ILifePointReplayState, amount: number): ILifePointReplayState {
  return { ...state, current: Math.min(state.max, state.current + amount) };
}

function markFirstReachedFinalAt(state: ILifePointReplayState, eventOrder: number): ILifePointReplayState {
  if (state.firstReachedFinalAt !== null || state.current !== state.final) return state;
  return { ...state, firstReachedFinalAt: eventOrder };
}

function replayFirstReachedFinalLpAt(gameState: GameState, playerId: string): number | null {
  let replay: ILifePointReplayState = {
    current: gameState.playerA.id === playerId ? gameState.playerA.maxHealthPoints : gameState.playerB.maxHealthPoints,
    max: gameState.playerA.id === playerId ? gameState.playerA.maxHealthPoints : gameState.playerB.maxHealthPoints,
    final: gameState.playerA.id === playerId ? gameState.playerA.healthPoints : gameState.playerB.healthPoints,
    firstReachedFinalAt: null,
  };

  replay = markFirstReachedFinalAt(replay, 0);
  for (let index = 0; index < gameState.combatLog.length; index += 1) {
    const event = gameState.combatLog[index];
    const parsed = parseTargetedAmount(event);
    if (!parsed || parsed.targetPlayerId !== playerId) continue;
    if (event.eventType === "DIRECT_DAMAGE") replay = applyDamage(replay, parsed.amount);
    if (event.eventType === "HEAL_APPLIED") replay = applyHeal(replay, parsed.amount);
    replay = markFirstReachedFinalAt(replay, index + 1);
  }

  return replay.firstReachedFinalAt;
}

function resolveWinnerByTurnLimit(gameState: GameState): string | "DRAW" {
  const playerA = gameState.playerA;
  const playerB = gameState.playerB;
  if (playerA.healthPoints > playerB.healthPoints) return playerA.id;
  if (playerB.healthPoints > playerA.healthPoints) return playerB.id;

  const playerAReachedAt = replayFirstReachedFinalLpAt(gameState, playerA.id);
  const playerBReachedAt = replayFirstReachedFinalLpAt(gameState, playerB.id);
  if (playerAReachedAt === null || playerBReachedAt === null) return "DRAW";
  if (playerAReachedAt < playerBReachedAt) return playerB.id;
  if (playerBReachedAt < playerAReachedAt) return playerA.id;
  return "DRAW";
}

/**
 * Determina el ganador del duelo.
 * Reglas:
 * 1) KO inmediato si algún LP llega a 0.
 * 2) Si no hay KO y el turno alcanza el límite, gana quien tenga más LP.
 * 3) En empate de LP al límite, pierde quien alcanzó antes ese LP final.
 */
export function resolveWinnerPlayerId(gameState: GameState, maxTurnLimit = DEFAULT_MAX_TURN_LIMIT): string | "DRAW" | null {
  if (gameState.playerA.healthPoints <= 0 && gameState.playerB.healthPoints <= 0) return "DRAW";
  if (gameState.playerA.healthPoints <= 0) return gameState.playerB.id;
  if (gameState.playerB.healthPoints <= 0) return gameState.playerA.id;
  if (gameState.turn < maxTurnLimit) return null;
  return resolveWinnerByTurnLimit(gameState);
}
