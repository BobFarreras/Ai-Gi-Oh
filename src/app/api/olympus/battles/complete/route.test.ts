// src/app/api/olympus/battles/complete/route.test.ts - Verifica que ticket, modo y prueba deben coincidir.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetPveRateLimiterForTests } from "@/services/security/api/rate-limit/pve-rate-limiter";

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: () => null,
}));
vi.mock("@/services/olympus/create-olympus-route-context", () => ({
  createOlympusRouteContext: vi.fn().mockResolvedValue({
    playerId: "player-1",
    repository: {},
    response: { headers: new Headers() },
  }),
}));
vi.mock("@/services/security/duel-completion-ticket", () => ({
  verifyCombatSessionTicket: () => ({
    sessionId: "session-firmada",
    battleId: "battle-1",
    snapshotHash: "hash",
    protocolVersion: 3,
  }),
}));

import { POST } from "./route";

function request(body: unknown): NextRequest {
  return {
    json: async () => body,
    headers: new Headers({ "x-forwarded-for": "203.0.113.20" }),
  } as unknown as NextRequest;
}

describe("POST /api/olympus/battles/complete", () => {
  beforeEach(() => resetPveRateLimiterForTests());

  it("rechaza una prueba perteneciente a otra sesión", async () => {
    const response = await POST(request({
      completionTicket: "ticket",
      proof: {
        sessionId: "session-manipulada", battleId: "battle-1", mode: "OLYMPUS",
        snapshotHash: "hash", protocolVersion: 3, entries: [],
      },
    }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rechaza una prueba de otro modo aunque el ticket sea válido", async () => {
    const response = await POST(request({
      completionTicket: "ticket",
      proof: {
        sessionId: "session-firmada", battleId: "battle-1", mode: "TRAINING",
        snapshotHash: "hash", protocolVersion: 3, entries: [],
      },
    }));
    expect(response.status).toBe(400);
  });

  it("rechaza un snapshot manipulado", async () => {
    const response = await POST(request({
      completionTicket: "ticket",
      proof: {
        sessionId: "session-firmada", battleId: "battle-1", mode: "OLYMPUS",
        snapshotHash: "hash-falso", protocolVersion: 3, entries: [],
      },
    }));
    expect(response.status).toBe(400);
  });
});
