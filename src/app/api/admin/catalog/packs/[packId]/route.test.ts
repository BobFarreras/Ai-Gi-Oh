// src/app/api/admin/catalog/packs/[packId]/route.test.ts - Cubre borrado seguro de packs admin con rate-limit y auditoría.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { DELETE } from "@/app/api/admin/catalog/packs/[packId]/route";

const requireTrustedMutationOriginMock = vi.fn();
const createAdminCatalogContextMock = vi.fn();
const consumeAdminMutationRateLimitMock = vi.fn();

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: (...args: unknown[]) => requireTrustedMutationOriginMock(...args),
}));
vi.mock("@/services/admin/api/create-admin-catalog-context", () => ({
  createAdminCatalogContext: (...args: unknown[]) => createAdminCatalogContextMock(...args),
}));
vi.mock("@/services/admin/api/security/admin-rate-limiter", () => ({
  consumeAdminMutationRateLimit: (...args: unknown[]) => consumeAdminMutationRateLimitMock(...args),
}));

function createRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/catalog/packs/pack-core-alpha", { method: "DELETE" });
}

describe("DELETE /api/admin/catalog/packs/[packId]", () => {
  it("responde 429 cuando el rate limit bloquea el borrado", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminCatalogContextMock.mockResolvedValueOnce({
      profile: { userId: "admin-1" },
      response: NextResponse.json({ ok: true }),
    });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(false);
    const response = await DELETE(createRequest(), { params: { packId: "pack-core-alpha" } });
    expect(response.status).toBe(429);
  });

  it("elimina pack y registra evento de auditoría", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    const deletePackUseCase = { execute: vi.fn(async () => undefined) };
    const writeAuditLogUseCase = { execute: vi.fn(async () => undefined) };
    createAdminCatalogContextMock.mockResolvedValueOnce({
      profile: { userId: "admin-1" },
      response: NextResponse.json({ ok: true }),
      deletePackUseCase,
      writeAuditLogUseCase,
    });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(true);
    const response = await DELETE(createRequest(), { params: { packId: "pack-core-alpha" } });
    expect(response.status).toBe(200);
    expect(deletePackUseCase.execute).toHaveBeenCalledWith("pack-core-alpha");
    expect(writeAuditLogUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("responde 403 cuando la sesión autenticada no es admin", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminCatalogContextMock.mockRejectedValueOnce(new AuthorizationError("Forbidden"));
    const response = await DELETE(createRequest(), { params: { packId: "pack-core-alpha" } });
    expect(response.status).toBe(403);
  });
});
