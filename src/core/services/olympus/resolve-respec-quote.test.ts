// src/core/services/olympus/resolve-respec-quote.test.ts - Verifica coste por rango, reembolso y primera reasignación gratuita.
import { describe, expect, it } from "vitest";
import {
  IOlympusChampionProgress,
  IOlympusSettings,
  IOlympusUpgradeNode,
} from "@/core/entities/olympus/IOlympus";
import { resolveInvestedInNode, resolveNextRankCost, resolveRespecQuote } from "./resolve-respec-quote";

const settings: IOlympusSettings = {
  version: 1,
  dailyAttemptLimit: 3,
  battleTtlMinutes: 45,
  respecFreeAllowance: 1,
  respecCost: 60,
  respecRefundPercent: 75,
};

const nodes = [
  { id: "power", fragmentCost: 40, maxRank: 16 },
  { id: "identity", fragmentCost: 60, maxRank: 3 },
] as IOlympusUpgradeNode[];

const progress = (overrides: Partial<IOlympusChampionProgress>): IOlympusChampionProgress => ({
  championId: "gennvim",
  unlockedNodeIds: ["power"],
  nodeRanks: { power: 1 },
  respecCount: 0,
  version: 1,
  ...overrides,
});

describe("resolveNextRankCost", () => {
  it("encarece cada rango: el primero es accesible y los últimos cuestan varias expediciones", () => {
    expect(resolveNextRankCost(40, 0)).toBe(40);
    expect(resolveNextRankCost(40, 1)).toBe(80);
    expect(resolveNextRankCost(40, 5)).toBe(240);
  });
});

describe("resolveInvestedInNode", () => {
  it("suma lo pagado en todos los rangos, no solo el último", () => {
    expect(resolveInvestedInNode(40, 0)).toBe(0);
    expect(resolveInvestedInNode(40, 1)).toBe(40);
    // 40 + 80 + 120 = 240
    expect(resolveInvestedInNode(40, 3)).toBe(240);
  });
});

describe("resolveRespecQuote", () => {
  it("la primera reasignación devuelve el porcentaje configurado sin cobrar", () => {
    expect(resolveRespecQuote(settings, nodes, progress({}))).toMatchObject({
      invested: 40,
      refund: 30,
      charge: 0,
      netBalanceChange: 30,
      free: true,
    });
  });

  it("reembolsa todos los rangos comprados de todos los nodos", () => {
    const quote = resolveRespecQuote(settings, nodes, progress({ nodeRanks: { power: 3, identity: 2 } }));
    // power: 40+80+120 = 240; identity: 60+120 = 180 → 420 invertidos.
    expect(quote.invested).toBe(420);
    expect(quote.refund).toBe(315);
  });

  it("las siguientes cobran el coste configurado", () => {
    expect(resolveRespecQuote(settings, nodes, progress({ respecCount: 1 }))).toMatchObject({
      charge: 60,
      netBalanceChange: -30,
      free: false,
    });
  });

  it("un árbol sin rangos no genera reembolso", () => {
    expect(resolveRespecQuote(settings, nodes, progress({ nodeRanks: {}, unlockedNodeIds: [] }))).toMatchObject({
      invested: 0,
      refund: 0,
    });
  });
});
