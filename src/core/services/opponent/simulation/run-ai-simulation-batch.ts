// src/core/services/opponent/simulation/run-ai-simulation-batch.ts - Corre N duelos IA-vs-IA y agrega
// resultados (win-rate por lado, empates, turnos y métricas medias). Es la herramienta de medición de la
// ficha 5: comparar el mismo batch antes/después de un cambio dice si la IA mejora de verdad.
import { ICard } from "@/core/entities/ICard";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { reshuffleDeck } from "./build-simulation-deck";
import { IAiMatchPlayerMetricsKey, IAiPlayerMetrics, simulateAiMatch } from "./simulate-ai-match";

export interface IMatchupSideConfig {
  difficulty: OpponentDifficulty;
  aiProfile?: unknown;
  deck: ICard[];
  fusionDeck?: ICard[];
}

export interface ISimulationBatchConfig {
  a: IMatchupSideConfig;
  b: IMatchupSideConfig;
  matches: number;
  /** Semilla base; cada duelo usa `${seed}-${i}` para variar mano/inicio de forma reproducible. */
  seed: string;
  maxTurns?: number;
}

export interface ISimulationSideSummary {
  wins: number;
  winRate: number;
  avgMetrics: IAiPlayerMetrics;
}

export interface ISimulationBatchSummary {
  matches: number;
  draws: number;
  stuck: number;
  avgTurns: number;
  a: ISimulationSideSummary;
  b: ISimulationSideSummary;
}

const METRIC_KEYS: IAiMatchPlayerMetricsKey[] = ["summonsAttack", "summonsDefense", "fusions", "attacksDeclared", "finalHealth"];

function accumulate(target: IAiPlayerMetrics, source: IAiPlayerMetrics): void {
  for (const key of METRIC_KEYS) target[key] += source[key];
}

function averaged(total: IAiPlayerMetrics, matches: number): IAiPlayerMetrics {
  const result = { summonsAttack: 0, summonsDefense: 0, fusions: 0, attacksDeclared: 0, finalHealth: 0 };
  for (const key of METRIC_KEYS) result[key] = matches > 0 ? total[key] / matches : 0;
  return result;
}

export function runAiSimulationBatch(config: ISimulationBatchConfig): ISimulationBatchSummary {
  const aId = "sim-a";
  const bId = "sim-b";
  let aWins = 0;
  let bWins = 0;
  let draws = 0;
  let stuck = 0;
  let totalTurns = 0;
  const aTotals: IAiPlayerMetrics = { summonsAttack: 0, summonsDefense: 0, fusions: 0, attacksDeclared: 0, finalHealth: 0 };
  const bTotals: IAiPlayerMetrics = { summonsAttack: 0, summonsDefense: 0, fusions: 0, attacksDeclared: 0, finalHealth: 0 };

  for (let index = 0; index < config.matches; index += 1) {
    // Cada lado roba de SU mazo barajado por partida (nada de partida espejo): así la calidad de la IA se
    // expresa y no gana solo quien empieza. Mismos seeds antes/después de un cambio → matchups comparables.
    const result = simulateAiMatch({
      playerA: { id: aId, name: "A", deck: reshuffleDeck(config.a.deck, `${config.seed}-${index}-a`), fusionDeck: config.a.fusionDeck, strategy: new HeuristicOpponentStrategy({ difficulty: config.a.difficulty, aiProfile: config.a.aiProfile }) },
      playerB: { id: bId, name: "B", deck: reshuffleDeck(config.b.deck, `${config.seed}-${index}-b`), fusionDeck: config.b.fusionDeck, strategy: new HeuristicOpponentStrategy({ difficulty: config.b.difficulty, aiProfile: config.b.aiProfile }) },
      seed: `${config.seed}-${index}`,
      maxTurns: config.maxTurns,
    });
    totalTurns += result.turns;
    accumulate(aTotals, result.metrics[aId]);
    accumulate(bTotals, result.metrics[bId]);
    if (result.winner === aId) aWins += 1;
    else if (result.winner === bId) bWins += 1;
    else if (result.winner === "DRAW") draws += 1;
    else stuck += 1;
  }

  const matches = config.matches;
  return {
    matches,
    draws,
    stuck,
    avgTurns: matches > 0 ? totalTurns / matches : 0,
    a: { wins: aWins, winRate: matches > 0 ? aWins / matches : 0, avgMetrics: averaged(aTotals, matches) },
    b: { wins: bWins, winRate: matches > 0 ? bWins / matches : 0, avgMetrics: averaged(bTotals, matches) },
  };
}
