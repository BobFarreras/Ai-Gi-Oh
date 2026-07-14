// src/core/use-cases/game-engine/state/id-factory.ts - Fábrica de identificadores y timestamps del motor para permitir ejecución determinista en tests.
import { CombatLogEventType } from "@/core/entities/ICombatLog";
import { RandomSource, createSeededRandom } from "@/core/services/random/seeded-rng";

export interface IGameEngineIdFactory {
  createEntityInstanceId: (cardId: string) => string;
  createFusionInstanceId: (cardId: string) => string;
  /** `cardKey` es el runtimeId de la carta (único por copia física), no su cardId de catálogo. */
  createRevivedInstanceId: (cardKey: string, slotIndex: number) => string;
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
    createRevivedInstanceId: (cardKey: string, slotIndex: number) => `revived-${cardKey}-${nowSource()}-${slotIndex}`,
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
  // Contador EXCLUSIVO del combat log. No lo comparte ningún id de juego: los eventos de log
  // se generan también fuera del motor (telemetría de turno, EXP al cerrar el duelo) y esos
  // eventos son locales de un cliente, así que el contador diverge entre clientes. Mientras
  // solo alimente ids de log (claves de React) esa divergencia es inofensiva.
  let logCounter = 0;
  const nextLogSuffix = () => {
    logCounter += 1;
    return `${logCounter}-${createRandomSuffix(randomSource, 6)}`;
  };
  return {
    // Todos los ids de instancia (que las acciones de red referencian) se derivan SOLO de datos
    // del estado —el runtimeId único de la carta, deterministas por seed y propietario—, nunca de
    // un contador de la fábrica. Así coinciden en ambos clientes pase lo que pase con los logs.
    createEntityInstanceId: (cardKey: string) => `mp-ent-${cardKey}`,
    // cardKey incluye los materiales (deterministas) ⇒ único; sin contador.
    createFusionInstanceId: (cardKey: string) => `mp-fus-${cardKey}`,
    // cardKey es el runtimeId: una copia física de una carta solo existe en un sitio a la vez,
    // así que el id es único entre las instancias vivas aunque se reviva la misma carta dos veces.
    createRevivedInstanceId: (cardKey: string, slotIndex: number) => `mp-rev-${cardKey}-${slotIndex}`,
    createCombatLogEventId: (eventType) => `mp-log-${eventType}-${nextLogSuffix()}`,
    createTimestampIso: () => new Date(logCounter * 1000).toISOString(),
  };
}
