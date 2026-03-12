// src/core/use-cases/game-engine/state/id-factory.ts - Fábrica de identificadores y timestamps del motor para permitir ejecución determinista en tests.
import { CombatLogEventType } from "@/core/entities/ICombatLog";
import { RandomSource } from "@/core/services/random/seeded-rng";

export interface IGameEngineIdFactory {
  createEntityInstanceId: (cardId: string) => string;
  createFusionInstanceId: (cardId: string) => string;
  createRevivedInstanceId: (cardId: string, slotIndex: number) => string;
  createCombatLogEventId: (eventType: CombatLogEventType) => string;
  createTimestampIso: () => string;
}

function createRandomSuffix(randomSource: RandomSource, length: number): string {
  return Math.floor(randomSource() * 1_000_000_000)
    .toString(36)
    .slice(0, length)
    .padEnd(length, "0");
}

/**
 * Crea una fábrica configurable para aislar no determinismo por tiempo/aleatoriedad.
 */
export function createGameEngineIdFactory(
  randomSource: RandomSource = Math.random,
  nowSource: () => number = () => Date.now(),
  dateSource: () => Date = () => new Date(),
): IGameEngineIdFactory {
  return {
    createEntityInstanceId: (cardId: string) => `${cardId}-${nowSource()}-${createRandomSuffix(randomSource, 9)}`,
    createFusionInstanceId: (cardId: string) => `${cardId}-${nowSource()}-${createRandomSuffix(randomSource, 9)}`,
    createRevivedInstanceId: (cardId: string, slotIndex: number) => `revived-${cardId}-${nowSource()}-${slotIndex}`,
    createCombatLogEventId: (eventType: CombatLogEventType) => `${eventType}-${nowSource()}-${createRandomSuffix(randomSource, 8)}`,
    createTimestampIso: () => dateSource().toISOString(),
  };
}

export const defaultGameEngineIdFactory = createGameEngineIdFactory();
