// src/app/api/survival/runs/start/route.test.ts - Verifica reanudación idempotente desde la API.
import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";

const { repository } = vi.hoisted(() => ({
  repository: {
    getActiveRun: vi.fn().mockResolvedValue({ id: "run-1", playerId: "player-1", status: "ACTIVE" }),
    startRun: vi.fn(),
  },
}));

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: () => null,
}));
vi.mock("@/services/survival/create-survival-route-context", () => ({
  createSurvivalRouteContext: vi.fn().mockResolvedValue({
    playerId: "player-1",
    repository: repository as unknown as ISurvivalRepository,
    response: { headers: new Headers() },
  }),
}));

import { POST } from "./route";

describe("POST /api/survival/runs/start", () => {
  it("devuelve la expedición activa sin duplicarla", async () => {
    const response = await POST({} as NextRequest);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ resumed: true, run: { id: "run-1" } });
    expect(repository.startRun).not.toHaveBeenCalled();
  });
});
