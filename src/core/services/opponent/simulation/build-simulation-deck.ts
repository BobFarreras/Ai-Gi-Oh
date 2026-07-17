// src/core/services/opponent/simulation/build-simulation-deck.ts - Construye mazos deterministas para el
// simulador de la ficha 5 a partir del catálogo mock (entidades, magias, trampas). No es contenido de juego:
// solo material representativo para medir la IA de forma reproducible.
import { ICard } from "@/core/entities/ICard";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";

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

/**
 * Mazo capaz de FUSIONAR (ficha 5 fase 4): incluye el ejecutable de fusión, copias de los dos materiales de
 * la receta y relleno; el `fusionDeck` lleva la carta resultado. Sirve para verificar/medir que el
 * planificador de fusión de la IA monta la fusión cuando el mazo tiene las piezas.
 */
export function buildFusionSimulationDeck(seed: string, recipeId = "fusion-pytgress"): { deck: ICard[]; fusionDeck: ICard[] } {
  const random = createSeededRandom(seed);
  const fusion = FUSION_CARDS.find((card) => card.id === recipeId);
  const fusionExecution = EXECUTION_CARDS.find((card) => card.effect?.action === "FUSION_SUMMON" && card.effect.recipeId === recipeId);
  if (!fusion || !fusionExecution) throw new Error(`Receta de fusión no encontrada para el sim: ${recipeId}`);
  const materialIds = fusion.fusionMaterials ?? [];
  const materials = materialIds.flatMap((id) => {
    const card = ENTITY_CARDS.find((entity) => entity.id === id);
    return card ? [{ ...card }] : [];
  });
  // 3 ejecutables + 3 copias de cada material + relleno de entidades = 20 cartas.
  const copies = <T,>(card: T, n: number): T[] => Array.from({ length: n }, () => ({ ...card }));
  const fusionPieces = [
    ...copies(fusionExecution, 3),
    ...materials.flatMap((material) => copies(material, 3)),
  ];
  const fillerCount = Math.max(0, 20 - fusionPieces.length);
  return {
    deck: [...fusionPieces, ...take(ENTITY_CARDS, fillerCount, random)],
    fusionDeck: [{ ...fusion }],
  };
}
