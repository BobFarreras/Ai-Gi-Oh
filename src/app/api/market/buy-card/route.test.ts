// src/app/api/market/buy-card/route.test.ts - Garantiza que comprar una carta emite la acción de progresión BUY_CARD.
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({ requireTrustedMutationOrigin: () => null }));
vi.mock("@/services/security/api/request-body-parser", () => ({
  readJsonObjectBody: async () => ({ listingId: "listing-1" }),
  readRequiredStringField: (obj: Record<string, unknown>, key: string) => obj[key],
}));
vi.mock("@/services/progression/record-progression-event", () => ({ recordProgressionEvent: vi.fn() }));

const client = { id: "client" };
const context = {
  playerId: "u1",
  response: { headers: new Headers() },
  repositories: { client, collectionRepository: { getCollection: vi.fn().mockResolvedValue([]) } },
  buyCardUseCase: { execute: vi.fn().mockResolvedValue(undefined) },
  getCatalogUseCase: { execute: vi.fn().mockResolvedValue({}) },
  getTransactionsUseCase: { execute: vi.fn().mockResolvedValue([]) },
};
vi.mock("@/app/api/market/internal/create-market-route-context", () => ({ createMarketRouteContext: vi.fn(async () => context) }));

import { POST } from "./route";
import { recordProgressionEvent } from "@/services/progression/record-progression-event";

describe("POST /api/market/buy-card", () => {
  beforeEach(() => vi.clearAllMocks());

  it("emite BUY_CARD tras comprar una carta", async () => {
    await POST({} as unknown as NextRequest);
    expect(context.buyCardUseCase.execute).toHaveBeenCalled();
    expect(recordProgressionEvent).toHaveBeenCalledWith(client, ["BUY_CARD"]);
  });
});
