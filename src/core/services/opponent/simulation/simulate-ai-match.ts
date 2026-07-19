// src/core/services/opponent/simulation/simulate-ai-match.ts - Juega un duelo COMPLETO IA-vs-IA con el motor
// puro (sin UI ni timings), dirigiendo AMBOS jugadores con runOpponentStep. Es la base del simulador de la
// ficha 5: determinista con seed, devuelve ganador + métricas para medir si un cambio mejora la IA.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { resolveWinnerPlayerId } from "@/core/services/turn/resolve-winner-player-id";
import { runOpponentStep } from "@/core/services/opponent/runOpponentStep";
import { IOpponentStrategy } from "@/core/services/opponent/types";

export interface IAiMatchPlayerConfig {
  id: string;
  name: string;
  deck: ICard[];
  fusionDeck?: ICard[];
  strategy: IOpponentStrategy;
}

export interface IAiMatchConfig {
  playerA: IAiMatchPlayerConfig;
  playerB: IAiMatchPlayerConfig;
  seed: string;
  /** Límite de turnos (por defecto el mismo que el resolver de ganador). */
  maxTurns?: number;
  openingHandSize?: number;
}

/** Métricas por jugador que interesan a las mejoras de la ficha 5 (posición, fusiones, presión). */
export interface IAiPlayerMetrics {
  summonsAttack: number;
  summonsDefense: number;
  fusions: number;
  attacksDeclared: number;
  finalHealth: number;
}

export type IAiMatchPlayerMetricsKey = keyof IAiPlayerMetrics;

export interface IAiMatchResult {
  /** id del ganador, "DRAW" o "STUCK" si la IA no pudo progresar (no debería pasar). */
  winner: string | "DRAW" | "STUCK";
  turns: number;
  metrics: Record<string, IAiPlayerMetrics>;
}

function playerById(state: GameState, id: string): IPlayer {
  return state.playerA.id === id ? state.playerA : state.playerB;
}

function emptyMetrics(): IAiPlayerMetrics {
  return { summonsAttack: 0, summonsDefense: 0, fusions: 0, attacksDeclared: 0, finalHealth: 0 };
}

/** Detecta invocaciones nuevas del jugador activo comparando su tablero antes/después de un paso. */
function trackSummons(before: IPlayer, after: IPlayer, metrics: IAiPlayerMetrics): void {
  if (after.activeEntities.length <= before.activeEntities.length) return;
  const beforeIds = new Set(before.activeEntities.map((entity) => entity.instanceId));
  for (const entity of after.activeEntities) {
    if (beforeIds.has(entity.instanceId)) continue;
    if (entity.card.type === "FUSION") metrics.fusions += 1;
    if (entity.mode === "ATTACK") metrics.summonsAttack += 1;
    else metrics.summonsDefense += 1;
  }
}

/**
 * Simula un duelo entre dos IAs. En cada iteración actúa el jugador activo (runOpponentStep solo actúa si es
 * su turno), hasta KO o límite de turnos. Si un paso no cambia el estado (bloqueo inesperado), corta.
 */
export function simulateAiMatch(config: IAiMatchConfig): IAiMatchResult {
  const maxTurns = config.maxTurns ?? 30;
  const randomSource = createSeededRandom(config.seed);
  let state = createInitialGameState({
    playerA: { id: config.playerA.id, name: config.playerA.name, deck: config.playerA.deck, fusionDeck: config.playerA.fusionDeck },
    playerB: { id: config.playerB.id, name: config.playerB.name, deck: config.playerB.deck, fusionDeck: config.playerB.fusionDeck },
    openingHandSize: config.openingHandSize ?? 5,
    randomSource,
  });

  const strategyById: Record<string, IOpponentStrategy> = {
    [config.playerA.id]: config.playerA.strategy,
    [config.playerB.id]: config.playerB.strategy,
  };
  const metrics: Record<string, IAiPlayerMetrics> = {
    [config.playerA.id]: emptyMetrics(),
    [config.playerB.id]: emptyMetrics(),
  };

  // Cota dura de iteraciones: cada turno son unos pocos pasos; el límite de turnos ya corta antes.
  const maxIterations = maxTurns * 200;
  let iterations = 0;
  let winner = resolveWinnerPlayerId(state, maxTurns);
  while (winner === null) {
    if (iterations++ >= maxIterations) return { winner: "STUCK", turns: state.turn, metrics: withFinalHealth(state, metrics) };
    const activeId = state.activePlayerId;
    // El jugador inicial no puede atacar en el turno 1 (regla del motor). El runner de UI lo salta con su
    // propio guard; aquí, dirigiendo el motor puro, avanzamos de fase igual para no chocar con esa regla.
    if (state.phase === "BATTLE" && state.turn === 1 && state.startingPlayerId === activeId) {
      state = GameEngine.nextPhase(state);
      winner = resolveWinnerPlayerId(state, maxTurns);
      continue;
    }
    const before = playerById(state, activeId);
    const next = runOpponentStep(state, activeId, strategyById[activeId]);
    // runOpponentStep siempre avanza en MAIN_1/BATTLE (juega o pasa de fase). Si no cambia el estado es un
    // bloqueo real (acción pendiente sin selección): se corta como STUCK para no colgar el simulador.
    if (next === state) return { winner: "STUCK", turns: state.turn, metrics: withFinalHealth(state, metrics) };
    trackSummons(before, playerById(next, activeId), metrics[activeId]);
    state = next;
    winner = resolveWinnerPlayerId(state, maxTurns);
  }

  // Ataques declarados: del log final (más fiable que diffear el tablero paso a paso).
  for (const event of state.combatLog) {
    if (event.eventType === "ATTACK_DECLARED" && typeof event.actorPlayerId === "string" && metrics[event.actorPlayerId]) {
      metrics[event.actorPlayerId].attacksDeclared += 1;
    }
  }
  return { winner, turns: state.turn, metrics: withFinalHealth(state, metrics) };
}

function withFinalHealth(state: GameState, metrics: Record<string, IAiPlayerMetrics>): Record<string, IAiPlayerMetrics> {
  metrics[state.playerA.id].finalHealth = state.playerA.healthPoints;
  metrics[state.playerB.id].finalHealth = state.playerB.healthPoints;
  return metrics;
}
