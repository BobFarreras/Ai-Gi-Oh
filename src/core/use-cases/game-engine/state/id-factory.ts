// src/core/use-cases/game-engine/state/id-factory.ts - Fábrica de identificadores y timestamps del motor para permitir ejecución determinista en tests.
import { CombatLogEventType } from "@/core/entities/ICombatLog";
import { RandomSource, createSeededRandom } from "@/core/services/random/seeded-rng";

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

/**
 * Fábrica determinista para multijugador: misma seed ⇒ misma secuencia de ids en
 * ambos clientes. Sustituye Date.now()/Math.random() por un RNG sembrado y un
 * contador monótono, de modo que re-ejecutar la misma secuencia de acciones
 * (lockstep por turnos) produzca instanceId idénticos. Imprescindible para que los
 * ataques y otras acciones que referencian instanceId resuelvan en ambos lados.
 */
export function createSeededGameEngineIdFactory(seed: string): IGameEngineIdFactory {
  const randomSource = createSeededRandom(`${seed}:idfactory`);
  let counter = 0;
  const nextSuffix = () => {
    counter += 1;
    return `${counter}-${createRandomSuffix(randomSource, 6)}`;
  };
  return {
    // El instanceId de entidad se deriva SOLO de la clave (runtimeId único de la
    // carta), sin contador: así coincide en ambos clientes aunque el consumo del
    // idFactory para logs/otros ids se desincronice. Es lo que hace que los ataques
    // (que referencian instanceId) resuelvan en el lado rival.
    createEntityInstanceId: (cardKey: string) => `mp-ent-${cardKey}`,
    createFusionInstanceId: (cardKey: string) => `mp-fus-${cardKey}-${nextSuffix()}`,
    createRevivedInstanceId: (cardId: string, slotIndex: number) => `mp-rev-${cardId}-${slotIndex}-${nextSuffix()}`,
    createCombatLogEventId: (eventType) => `mp-log-${eventType}-${nextSuffix()}`,
    createTimestampIso: () => new Date(counter * 1000).toISOString(),
  };
}
