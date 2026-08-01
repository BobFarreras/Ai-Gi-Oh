// src/core/services/olympus/assert-node-purchasable.test.ts - Verifica prerrequisitos, duplicados y saldo antes de comprar.
import { describe, expect, it } from "vitest";
import { IOlympusChampionProgress, IOlympusUpgradeNode } from "@/core/entities/olympus/IOlympus";
import { assertNodePurchasable } from "./assert-node-purchasable";

const node: IOlympusUpgradeNode = {
  id: "gennvim-power-2",
  championId: "gennvim",
  branch: "POWER",
  prerequisiteNodeIds: ["gennvim-power-1"],
  effect: { kind: "GLOBAL_LEVEL", amount: 5, cap: 30 },
  fragmentCost: 40,
  sortOrder: 11,
};

const progress: IOlympusChampionProgress = {
  championId: "gennvim",
  unlockedNodeIds: ["gennvim-power-1"],
  respecCount: 0,
  version: 1,
};

describe("assertNodePurchasable", () => {
  it("acepta un nodo con prerrequisitos cumplidos y saldo suficiente", () => {
    expect(() => assertNodePurchasable(node, progress, 40)).not.toThrow();
  });

  it("rechaza un nodo inexistente", () => {
    expect(() => assertNodePurchasable(undefined, progress, 999)).toThrow(/no existe/i);
  });

  it("rechaza comprar sin haber desbloqueado al campeón", () => {
    expect(() => assertNodePurchasable(node, null, 999)).toThrow(/desbloquear al campeón/i);
  });

  it("rechaza volver a comprar un nodo ya desbloqueado", () => {
    const owned = { ...progress, unlockedNodeIds: ["gennvim-power-1", "gennvim-power-2"] };
    expect(() => assertNodePurchasable(node, owned, 999)).toThrow(/ya está desbloqueado/i);
  });

  it("rechaza saltarse el orden del árbol", () => {
    expect(() => assertNodePurchasable(node, { ...progress, unlockedNodeIds: [] }, 999))
      .toThrow(/nodos previos/i);
  });

  it("rechaza comprar sin Fragmentos suficientes", () => {
    expect(() => assertNodePurchasable(node, progress, 39)).toThrow(/Fragmentos suficientes/i);
  });
});
