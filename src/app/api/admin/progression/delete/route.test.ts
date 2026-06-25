// src/app/api/admin/progression/delete/route.test.ts - Verifica que el endpoint admin elimina misiones (gate admin + service_role) y valida la entrada.
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({ requireTrustedMutationOrigin: () => null }));
vi.mock("@/services/admin/api/create-admin-route-context", () => ({
  createAdminRouteContext: vi.fn(async () => ({ response: { headers: new Headers() } })),
}));
vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client", () => ({
  createSupabaseServiceRoleClient: vi.fn(() => ({})),
}));

const deleteMission = vi.fn().mockResolvedValue(undefined);
vi.mock("@/infrastructure/persistence/supabase/SupabaseProgressionAdminRepository", () => ({
  SupabaseProgressionAdminRepository: class {
    deleteMission = deleteMission;
  },
}));

import { POST } from "./route";

function req(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

describe("POST /api/admin/progression/delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("elimina una misión por id", async () => {
    const res = await POST(req({ type: "mission", id: "evt-launch-mission-1" }));
    expect(res.status).toBe(200);
    expect(deleteMission).toHaveBeenCalledWith("evt-launch-mission-1");
  });

  it("rechaza id vacío sin borrar", async () => {
    const res = await POST(req({ type: "mission", id: "" }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(deleteMission).not.toHaveBeenCalled();
  });

  it("rechaza un tipo desconocido", async () => {
    const res = await POST(req({ type: "evento", id: "x" }));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(deleteMission).not.toHaveBeenCalled();
  });
});
