// src/app/api/home/collection/evolve/route.test.ts - Garantiza que evolucionar una carta emite la acción de progresión EVOLVE_CARD.
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({ requireTrustedMutationOrigin: () => null }));
vi.mock("@/services/security/api/request-body-parser", () => ({
  readJsonObjectBody: async () => ({ cardId: "entity-python" }),
  readRequiredStringField: (obj: Record<string, unknown>, key: string) => obj[key],
}));
vi.mock("@/services/progression/record-progression-event", () => ({ recordProgressionEvent: vi.fn() }));

const routeClient = { id: "route-client" };
vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-route-client", () => ({
  createSupabaseRouteClient: vi.fn(() => routeClient),
}));

const context = {
  playerId: "u1",
  response: { headers: new Headers() },
  evolveCardVersionUseCase: { execute: vi.fn().mockResolvedValue({ ok: true }) },
};
vi.mock("@/app/api/home/internal/create-home-route-context", () => ({ createHomeRouteContext: vi.fn(async () => context) }));

import { POST } from "./route";
import { recordProgressionEvent } from "@/services/progression/record-progression-event";

describe("POST /api/home/collection/evolve", () => {
  beforeEach(() => vi.clearAllMocks());

  it("emite EVOLVE_CARD tras evolucionar una carta", async () => {
    await POST({} as unknown as NextRequest);
    expect(context.evolveCardVersionUseCase.execute).toHaveBeenCalled();
    expect(recordProgressionEvent).toHaveBeenCalledWith(routeClient, ["EVOLVE_CARD"]);
  });
});
