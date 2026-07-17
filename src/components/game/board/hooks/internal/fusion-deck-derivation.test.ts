// fusion-deck-derivation.test.ts - El bloque de fusión incluye SIEMPRE el resultado de cada ejecutable
// FUSION_SUMMON del mazo (meter exec-fusion-X basta para poder fusionar; ya no hay execs muertos).
import { describe, expect, it } from "vitest";
import { fusionResultsForDeck, withDerivedFusionResults } from "./initialDeckFactory";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { ICard } from "@/core/entities/ICard";

const execRusty = EXECUTION_CARDS.find((c) => c.effect?.action === "FUSION_SUMMON" && c.effect.recipeId === "fusion-rustyfox")!;
const execPyt = EXECUTION_CARDS.find((c) => c.effect?.action === "FUSION_SUMMON" && c.effect.recipeId === "fusion-pytgress")!;
const plainEntity: ICard = { id: "entity-x", name: "X", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1200, defense: 1100 };

describe("derivación del bloque de fusión desde los execs del mazo", () => {
  it("un mazo con exec-fusion-rustyfox deriva la carta resultado fusion-rustyfox", () => {
    const results = fusionResultsForDeck([{ ...execRusty }, { ...plainEntity }]);
    expect(results.map((c) => c.id)).toEqual(["fusion-rustyfox"]);
    expect(results[0].type).toBe("FUSION");
  });

  it("withDerivedFusionResults añade lo que falta sin duplicar", () => {
    const deck = [{ ...execRusty }, { ...execPyt }];
    // El bloque ya trae pytgress; debe añadir rustyfox y NO duplicar pytgress.
    const fusionDeck = [{ id: "fusion-pytgress", name: "Pytgress", description: "", type: "FUSION" as const, faction: "OPEN_SOURCE" as const, cost: 6, attack: 2900, defense: 2700 }];
    const merged = withDerivedFusionResults(deck, fusionDeck);
    const ids = merged.map((c) => c.id).sort();
    expect(ids).toEqual(["fusion-pytgress", "fusion-rustyfox"]);
  });

  it("un mazo sin execs de fusión no deriva nada", () => {
    expect(fusionResultsForDeck([{ ...plainEntity }])).toEqual([]);
  });
});
