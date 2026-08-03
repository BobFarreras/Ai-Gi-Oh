// src/core/services/random/shuffle-with-random.test.ts - Verifica el barajado canónico compartido por los modos de combate.
import { describe, expect, it } from "vitest";
import { createSeededRandom } from "./seeded-rng";
import { shuffleWithRandom } from "./shuffle-with-random";

describe("shuffleWithRandom", () => {
  it("es reproducible por seed sin mutar la entrada", () => {
    const source = ["a", "b", "c", "d", "e"];
    const first = shuffleWithRandom(source, createSeededRandom("duel-1"));
    const replay = shuffleWithRandom(source, createSeededRandom("duel-1"));

    expect(replay).toEqual(first);
    expect(source).toEqual(["a", "b", "c", "d", "e"]);
  });
});
