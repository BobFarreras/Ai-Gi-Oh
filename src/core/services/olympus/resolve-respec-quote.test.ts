// src/core/services/olympus/resolve-respec-quote.test.ts - Verifica la primera reasignación gratuita y el coste posterior.
import { describe, expect, it } from "vitest";
import {
  IOlympusChampionProgress,
  IOlympusSettings,
  IOlympusUpgradeNode,
} from "@/core/entities/olympus/IOlympus";
import { resolveRespecQuote } from "./resolve-respec-quote";

const settings: IOlympusSettings = {
  version: 1,
  dailyAttemptLimit: 3,
  battleTtlMinutes: 45,
  respecFreeAllowance: 1,
  respecCost: 60,
  respecRefundPercent: 75,
};

const nodes = [
  { id: "power", fragmentCost: 40 },
  { id: "identity", fragmentCost: 60 },
] as IOlympusUpgradeNode[];

const progress = (overrides: Partial<IOlympusChampionProgress>): IOlympusChampionProgress => ({
  championId: "gennvim",
  unlockedNodeIds: ["power"],
  respecCount: 0,
  version: 1,
  ...overrides,
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

  it("las siguientes cobran el coste configurado", () => {
    expect(resolveRespecQuote(settings, nodes, progress({ respecCount: 1 }))).toMatchObject({
      charge: 60,
      netBalanceChange: -30,
      free: false,
    });
  });

  it("solo cuenta los nodos realmente comprados", () => {
    const quote = resolveRespecQuote(settings, nodes, progress({ unlockedNodeIds: ["power", "identity"] }));
    expect(quote).toMatchObject({ invested: 100, refund: 75 });
  });

  it("un árbol vacío no genera reembolso", () => {
    expect(resolveRespecQuote(settings, nodes, progress({ unlockedNodeIds: [] }))).toMatchObject({
      invested: 0,
      refund: 0,
    });
  });
});
