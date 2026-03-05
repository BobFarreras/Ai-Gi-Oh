// src/core/services/market/market-economy-rules.test.ts - Verifica validaciones de saldo Nexus y disponibilidad de compras.
import { describe, expect, it } from "vitest";
import { assertEnoughNexus, assertListingAvailable, assertPositiveNexusAmount } from "./market-economy-rules";

describe("market-economy-rules", () => {
  it("bloquea precios Nexus inválidos", () => {
    expect(() => assertPositiveNexusAmount(0)).toThrow("precio Nexus");
  });

  it("bloquea compra cuando no hay Nexus suficiente", () => {
    expect(() => assertEnoughNexus({ playerId: "player-a", nexus: 20 }, 50)).toThrow("Nexus suficiente");
  });

  it("bloquea productos sin disponibilidad", () => {
    expect(() => assertListingAvailable(false, 3)).toThrow("no está disponible");
    expect(() => assertListingAvailable(true, 0)).toThrow("no tiene stock");
  });
});
