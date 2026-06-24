// src/app/api/market/buy-pack/route.test.ts - Garantiza que comprar un sobre emite la acción de progresión BUY_PACK (regresión del bug de Fragmentos no sumados).
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({ requireTrustedMutationOrigin: () => null }));
vi.mock("@/services/security/api/request-body-parser", () => ({
  readJsonObjectBody: async () => ({ packId: "pack-1" }),
  readRequiredStringField: (obj: Record<string, unknown>, key: string) => obj[key],
}));
vi.mock("@/services/progression/record-progression-event", () => ({ recordProgressionEvent: vi.fn() }));

const client = { id: "client" };
const context = {
  playerId: "u1",
  response: { headers: new Headers() },
  repositories: { client, collectionRepository: { getCollection: vi.fn().mockResolvedValue([]) } },
  buyPackUseCase: { execute: vi.fn().mockResolvedValue(["c1"]) },
  getCatalogUseCase: { execute: vi.fn().mockResolvedValue({}) },
  getTransactionsUseCase: { execute: vi.fn().mockResolvedValue([]) },
};
vi.mock("@/app/api/market/internal/create-market-route-context", () => ({ createMarketRouteContext: vi.fn(async () => context) }));

import { POST } from "./route";
import { recordProgressionEvent } from "@/services/progression/record-progression-event";

describe("POST /api/market/buy-pack", () => {
  beforeEach(() => vi.clearAllMocks());

  it("emite BUY_PACK tras comprar un sobre", async () => {
    await POST({} as unknown as NextRequest);
    expect(context.buyPackUseCase.execute).toHaveBeenCalled();
    expect(recordProgressionEvent).toHaveBeenCalledWith(client, ["BUY_PACK"]);
  });
});
