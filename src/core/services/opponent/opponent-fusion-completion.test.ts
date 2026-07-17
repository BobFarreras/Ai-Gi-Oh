// src/core/services/opponent/opponent-fusion-completion.test.ts - Regresión (petición del usuario 2026-07-17):
// la IA debe COMPLETAR la fusión para TODAS las recetas del juego y con cualquier coste de material. Antes no
// hacía ninguna (el matcher exigía requiredEnergyPerMaterial/requiredTotalEnergy, que el motor IGNORA, así que
// rechazaba pares válidos como python(3)+postgress). Los materiales de algunas recetas viven en la BD (seeds),
// no en ENTITY_CARDS del código: aquí se sintetizan desde los ids de la receta para cubrir las 7.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { createBaseState, createBoardEntity } from "./HeuristicOpponentStrategy.test-fixtures";
import { runOpponentStep } from "./runOpponentStep";
import { pickPendingSelectionId } from "./run-opponent-step-helpers";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";
import { getFusionRecipeByResultId } from "@/core/use-cases/game-engine/fusion/fusion-recipes";
import { ICard } from "@/core/entities/ICard";

const fusionExecs = EXECUTION_CARDS.filter((card) => card.effect?.action === "FUSION_SUMMON");

/** Materiales de la receta como ICard (sintéticos: sirven tanto los del código como los que solo están en BD). */
function recipeMaterialCards(recipeId: string): ICard[] {
  const recipe = getFusionRecipeByResultId(recipeId);
  const ids = recipe?.requiredMaterialIds ?? FUSION_CARDS.find((c) => c.id === recipeId)?.fusionMaterials ?? [];
  return ids.map((id) => ({ id, name: id, description: "", type: "ENTITY" as const, faction: "OPEN_SOURCE" as const, cost: 4, attack: 1500, defense: 1100 }));
}

function completesFusion(exec: ICard): { recipeId: string; fused: boolean } {
  const recipeId = exec.effect?.action === "FUSION_SUMMON" ? exec.effect.recipeId : "";
  const fusionCard = FUSION_CARDS.find((card) => card.id === recipeId)!;
  const [anchor, inHand] = recipeMaterialCards(recipeId);
  const base = createBaseState();
  let state: GameState = {
    ...base,
    playerA: { ...base.playerA, activeEntities: [], hand: [] }, // sin amenaza
    playerB: {
      ...base.playerB,
      currentEnergy: 10,
      hand: [{ ...inHand }],
      activeEntities: [createBoardEntity("anchor", { ...anchor }, "DEFENSE")],
      activeExecutions: [{ instanceId: "set-exec", card: { ...exec }, mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false }],
      fusionDeck: [{ ...fusionCard }],
    },
    activePlayerId: "p2",
  };
  const strategy = new HeuristicOpponentStrategy({ difficulty: "MASTER" });
  let fused = false;
  for (let i = 0; i < 8 && state.phase === "MAIN_1"; i++) {
    const next = runOpponentStep(state, "p2", strategy);
    if (next.playerB.activeEntities.some((e) => e.card.type === "FUSION")) { fused = true; break; }
    if (next === state) break;
    state = next;
  }
  return { recipeId, fused };
}

describe("la IA completa TODAS las fusiones (regresión fusión efectiva)", () => {
  it("hay ejecutable de fusión para las 7 recetas", () => {
    expect(fusionExecs.length).toBe(7);
  });

  for (const exec of fusionExecs) {
    it(`completa ${exec.id}`, () => {
      const { recipeId, fused } = completesFusion(exec);
      expect(fused, `no fusionó ${recipeId}`).toBe(true);
    });
  }

  it("con el par en mesa, NUNCA descarta el ejecutable de fusión por límite de mano (bug reportado)", () => {
    const exec = fusionExecs.find((e) => e.effect?.action === "FUSION_SUMMON" && e.effect.recipeId === "fusion-pytgress")!;
    const fusionCard = FUSION_CARDS.find((c) => c.id === "fusion-pytgress")!;
    const [matA, matB] = recipeMaterialCards("fusion-pytgress");
    const bigEntity: ICard = { id: "big", name: "Big", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 6, attack: 2500, defense: 1700 };
    const base = createBaseState();
    const state: GameState = {
      ...base,
      playerB: {
        ...base.playerB,
        // 2 materiales EN MESA (fusión lista) + el ejecutable y una entity gorda en mano.
        activeEntities: [createBoardEntity("m1", { ...matA }, "DEFENSE"), createBoardEntity("m2", { ...matB }, "DEFENSE")],
        hand: [{ ...exec }, { ...bigEntity }],
        fusionDeck: [{ ...fusionCard }],
      },
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT", playerId: "p2" },
    } as GameState;
    const toDiscard = pickPendingSelectionId(state, "p2");
    expect(toDiscard).not.toBe(exec.id); // debe descartar la entity gorda, no el ejecutable imprescindible
    expect(toDiscard).toBe("big");
  });
});
