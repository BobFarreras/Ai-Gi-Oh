// src/core/services/random/shuffle-with-random.ts - Baraja colecciones con Fisher-Yates y una fuente aleatoria inyectable.
import { RandomSource } from "./seeded-rng";

/** Devuelve una copia barajada sin mutar la colección de entrada. */
export function shuffleWithRandom<T>(items: readonly T[], randomSource: RandomSource): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(randomSource() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
