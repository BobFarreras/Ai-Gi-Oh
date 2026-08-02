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
  maxRank: 16,
  sortOrder: 10,
};

const progress: IOlympusChampionProgress = {
  championId: "gennvim",
  unlockedNodeIds: ["gennvim-power-1"],
  nodeRanks: { "gennvim-power-1": 1 },
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

  it("deja seguir subiendo un nodo ya empezado: las mejoras se acumulan por rango", () => {
    const owned = {
      ...progress,
      unlockedNodeIds: ["gennvim-power-1", "gennvim-power-2"],
      nodeRanks: { "gennvim-power-1": 1, "gennvim-power-2": 3 },
    };
    expect(() => assertNodePurchasable(node, owned, 999)).not.toThrow();
  });

  it("rechaza pasar del rango máximo del nodo", () => {
    const maxed = { ...progress, nodeRanks: { "gennvim-power-1": 1, "gennvim-power-2": 16 } };
    expect(() => assertNodePurchasable(node, maxed, 999)).toThrow(/rango máximo/i);
  });

  it("rechaza saltarse el orden del árbol solo en el primer rango", () => {
    expect(() => assertNodePurchasable(node, { ...progress, unlockedNodeIds: [], nodeRanks: {} }, 999))
      .toThrow(/nodos previos/i);
    // Con el nodo ya abierto, subirlo no vuelve a exigir el prerrequisito.
    const started = { ...progress, unlockedNodeIds: [], nodeRanks: { "gennvim-power-2": 2 } };
    expect(() => assertNodePurchasable(node, started, 999)).not.toThrow();
  });

  it("cobra el rango siguiente, que es más caro que el primero", () => {
    // Rango 0 → siguiente cuesta 40; con rango 3 comprado, el siguiente cuesta 160.
    expect(() => assertNodePurchasable(node, { ...progress, nodeRanks: {} }, 39)).toThrow(/Éter suficiente/i);
    const started = { ...progress, nodeRanks: { "gennvim-power-1": 1, "gennvim-power-2": 3 } };
    expect(() => assertNodePurchasable(node, started, 159)).toThrow(/Éter suficiente/i);
    expect(() => assertNodePurchasable(node, started, 160)).not.toThrow();
  });
});
