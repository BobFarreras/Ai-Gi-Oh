// src/core/services/market/pack-rng.test.ts - Verifica selección ponderada y apertura de sobres en el mercado.
import { describe, expect, it } from "vitest";
import { IPackCardEntry } from "@/core/entities/market/IPackCardEntry";
import { openWeightedPack, pickWeightedEntry } from "./pack-rng";

const PACK_POOL: IPackCardEntry[] = [
  {
    id: "pool-common",
    rarity: "COMMON",
    weight: 80,
    card: { id: "entity-python", name: "Python", description: "Carta común", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3 },
  },
  {
    id: "pool-legendary",
    rarity: "LEGENDARY",
    weight: 1,
    card: { id: "fusion-gemgpt", name: "GemGPT", description: "Carta legendaria", type: "FUSION", faction: "BIG_TECH", cost: 7 },
  },
];

describe("pack-rng", () => {
  it("elige una entrada válida del pool ponderado", () => {
    const entry = pickWeightedEntry(PACK_POOL, () => 0.1);
    expect(["entity-python", "fusion-gemgpt"]).toContain(entry.card.id);
  });

  it("abre un sobre con la cantidad solicitada de cartas", () => {
    const cards = openWeightedPack(PACK_POOL, 5, () => 0.2);
    expect(cards).toHaveLength(5);
  });
});
