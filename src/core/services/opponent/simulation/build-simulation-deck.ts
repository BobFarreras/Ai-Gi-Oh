// src/core/services/opponent/simulation/build-simulation-deck.ts - Construye mazos deterministas para el
// simulador de la ficha 5 a partir del catálogo mock (entidades, magias, trampas). No es contenido de juego:
// solo material representativo para medir la IA de forma reproducible.
import { ICard } from "@/core/entities/ICard";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";

export interface ISimulationDeckMix {
  entities: number;
  executions: number;
  traps: number;
}

const DEFAULT_MIX: ISimulationDeckMix = { entities: 14, executions: 4, traps: 2 };

/** Reordena un mazo ya construido con la seed dada (mano/robo distintos por partida, reproducible). */
export function reshuffleDeck(deck: readonly ICard[], seed: string): ICard[] {
  return shuffled(deck, createSeededRandom(seed)).map((card) => ({ ...card }));
}

/** Baraja determinista (Fisher-Yates con RNG seedado): mismo seed → mismo orden. */
function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function take(pool: readonly ICard[], count: number, random: () => number): ICard[] {
  const bag = shuffled(pool, random);
  const picked: ICard[] = [];
  for (let index = 0; index < count; index += 1) picked.push({ ...bag[index % bag.length] });
  return picked;
}

/**
 * Un mazo de 20 cartas (14 entidades / 4 magias / 2 trampas por defecto), barajado con la seed dada.
 * Dos llamadas con la misma seed devuelven el MISMO mazo, para comparar batches de forma justa.
 */
export function buildSimulationDeck(seed: string, mix: ISimulationDeckMix = DEFAULT_MIX): ICard[] {
  const random = createSeededRandom(seed);
  return [
    ...take(ENTITY_CARDS, mix.entities, random),
    ...take(EXECUTION_CARDS, mix.executions, random),
    ...take(TRAP_CARDS, mix.traps, random),
  ];
}
