// src/core/services/market/pack-rng.ts - Selección ponderada de cartas para sobres del mercado.
import { IPackCardEntry } from "@/core/entities/market/IPackCardEntry";
import { ValidationError } from "@/core/errors/ValidationError";

export type RandomSource = () => number;

function assertValidPackPool(pool: IPackCardEntry[]): void {
  if (pool.length === 0) {
    throw new ValidationError("El pool del sobre está vacío.");
  }
  if (pool.some((entry) => entry.weight <= 0)) {
    throw new ValidationError("Todas las cartas del pool deben tener peso positivo.");
  }
}

export function pickWeightedEntry(pool: IPackCardEntry[], random: RandomSource): IPackCardEntry {
  assertValidPackPool(pool);
  const totalWeight = pool.reduce((accumulator, entry) => accumulator + entry.weight, 0);
  const target = random() * totalWeight;
  let cumulativeWeight = 0;

  for (const entry of pool) {
    cumulativeWeight += entry.weight;
    if (target <= cumulativeWeight) {
      return entry;
    }
  }

  return pool[pool.length - 1];
}

export function openWeightedPack(pool: IPackCardEntry[], cardsToOpen: number, random: RandomSource = Math.random): IPackCardEntry[] {
  assertValidPackPool(pool);
  if (!Number.isInteger(cardsToOpen) || cardsToOpen <= 0) {
    throw new ValidationError("La cantidad de cartas del sobre debe ser positiva.");
  }
  return Array.from({ length: cardsToOpen }, () => pickWeightedEntry(pool, random));
}
