// src/core/use-cases/market/internal/generate-market-transaction-id.test.ts - Valida formato y unicidad básica de IDs de transacción de mercado.
import { describe, expect, it } from "vitest";
import { generateMarketTransactionId } from "@/core/use-cases/market/internal/generate-market-transaction-id";

describe("generateMarketTransactionId", () => {
  it("genera IDs con prefijo y componente único", () => {
    const first = generateMarketTransactionId("listing-1");
    const second = generateMarketTransactionId("listing-1");
    expect(first.startsWith("tx-listing-1-")).toBe(true);
    expect(second.startsWith("tx-listing-1-")).toBe(true);
    expect(first).not.toBe(second);
  });
});
