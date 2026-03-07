// src/core/services/random/seeded-rng.test.ts - Valida que el generador seeded produce secuencias reproducibles por seed.
import { describe, expect, it } from "vitest";
import { createSeededRandom } from "@/core/services/random/seeded-rng";

describe("seeded-rng", () => {
  it("genera misma secuencia para la misma seed", () => {
    const first = createSeededRandom("seed-123");
    const second = createSeededRandom("seed-123");
    const firstBatch = [first(), first(), first(), first()];
    const secondBatch = [second(), second(), second(), second()];
    expect(firstBatch).toEqual(secondBatch);
  });

  it("genera secuencias distintas para seeds distintas", () => {
    const first = createSeededRandom("seed-A");
    const second = createSeededRandom("seed-B");
    const firstBatch = [first(), first(), first()];
    const secondBatch = [second(), second(), second()];
    expect(firstBatch).not.toEqual(secondBatch);
  });
});
