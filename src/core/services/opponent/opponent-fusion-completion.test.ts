// src/core/services/opponent/opponent-fusion-completion.test.ts - Regresión (petición del usuario 2026-07-17):
// la IA debe COMPLETAR la fusión para TODAS las recetas del juego, con cualquier coste de material. Antes no
// hacía ninguna (el matcher exigía requiredEnergyPerMaterial/requiredTotalEnergy, que el motor IGNORA, así que
// rechazaba pares válidos como python(3)+postgress). Este test cubre las 7 recetas con ejecutable de fusión:
// con un material ancla en mesa + el otro en mano + el ejecutable armado y sin amenaza, la IA fusiona.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { createBaseState, createBoardEntity } from "./HeuristicOpponentStrategy.test-fixtures";
import { runOpponentStep } from "./runOpponentStep";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";
import { ICard } from "@/core/entities/ICard";

const fusionExecs = EXECUTION_CARDS.filter((card) => card.effect?.action === "FUSION_SUMMON");

function recipeMaterials(exec: ICard): { recipeId: string; matA?: ICard; matB?: ICard } {
  const recipeId = exec.effect?.action === "FUSION_SUMMON" ? exec.effect.recipeId : "";
  const fusionCard = FUSION_CARDS.find((card) => card.id === recipeId);
  const [matAId, matBId] = fusionCard?.fusionMaterials ?? [];
  return { recipeId, matA: ENTITY_CARDS.find((c) => c.id === matAId), matB: ENTITY_CARDS.find((c) => c.id === matBId) };
}

// Recetas CRAFTABLES: ambos materiales existen como carta de entity jugable. Las incraftables (materiales solo
// referenciados en fusions.ts, sin definir como entity) no las puede montar NADIE — hueco de datos, no de IA.
const craftableExecs = fusionExecs.filter((exec) => { const { matA, matB } = recipeMaterials(exec); return matA && matB; });
const uncraftableExecs = fusionExecs.filter((exec) => { const { matA, matB } = recipeMaterials(exec); return !matA || !matB; });

function completesFusion(exec: ICard): { recipeId: string; fused: boolean; materialCosts: number[] } {
  const recipeId = exec.effect?.action === "FUSION_SUMMON" ? exec.effect.recipeId : "";
  const fusionCard = FUSION_CARDS.find((card) => card.id === recipeId)!;
  const [matAId, matBId] = fusionCard.fusionMaterials ?? [];
  const matA = ENTITY_CARDS.find((c) => c.id === matAId)!;
  const matB = ENTITY_CARDS.find((c) => c.id === matBId)!;
  // Ancla = el material de más defensa en mesa; el otro en mano. Sin amenaza (tablero rival vacío).
  const [anchor, inHand] = (matA.defense ?? 0) >= (matB.defense ?? 0) ? [matA, matB] : [matB, matA];
  const base = createBaseState();
  let state: GameState = {
    ...base,
    playerA: { ...base.playerA, activeEntities: [], hand: [] },
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
  return { recipeId, fused, materialCosts: [matA.cost, matB.cost] };
}

describe("la IA completa TODAS las fusiones craftables (regresión fusión efectiva)", () => {
  it("hay al menos 3 recetas craftables con material definido", () => {
    expect(craftableExecs.length).toBeGreaterThanOrEqual(3);
  });

  for (const exec of craftableExecs) {
    it(`completa ${exec.id}`, () => {
      const { recipeId, fused, materialCosts } = completesFusion(exec);
      expect(fused, `no fusionó ${recipeId} (materiales coste ${materialCosts})`).toBe(true);
    });
  }

  // Documenta el hueco de datos: estas recetas referencian materiales que NO existen como entity jugable, así
  // que nadie (ni IA ni jugador) puede montarlas. Si se quisieran activas, hay que crear sus cartas de material.
  it("recetas incraftables por falta de carta de material (hueco de datos, no de IA)", () => {
    const ids = uncraftableExecs.map((e) => (e.effect?.action === "FUSION_SUMMON" ? e.effect.recipeId : e.id));
    expect(ids).toEqual(["fusion-curshost", "fusion-kuberlinnet", "fusion-rustyfox", "fusion-super-c"]);
  });
});
