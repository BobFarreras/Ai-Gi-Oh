// src/app/api/admin/catalog/packs/route.test.ts - Verifica flujo de creación/edición de packs admin y controles de seguridad.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { POST } from "@/app/api/admin/catalog/packs/route";

const requireTrustedMutationOriginMock = vi.fn();
const createAdminCatalogContextMock = vi.fn();
const readAdminPackCommandMock = vi.fn();
const consumeAdminMutationRateLimitMock = vi.fn();

vi.mock("@/services/security/api/require-trusted-mutation-origin", () => ({
  requireTrustedMutationOrigin: (...args: unknown[]) => requireTrustedMutationOriginMock(...args),
}));
vi.mock("@/services/admin/api/create-admin-catalog-context", () => ({
  createAdminCatalogContext: (...args: unknown[]) => createAdminCatalogContextMock(...args),
}));
vi.mock("@/services/admin/api/read-admin-catalog-command", () => ({
  readAdminPackCommand: (...args: unknown[]) => readAdminPackCommandMock(...args),
}));
vi.mock("@/services/admin/api/security/admin-rate-limiter", () => ({
  consumeAdminMutationRateLimit: (...args: unknown[]) => consumeAdminMutationRateLimitMock(...args),
}));

function createRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/catalog/packs", { method: "POST" });
}

describe("POST /api/admin/catalog/packs", () => {
  it("corta mutación con 403 cuando el origin no es confiable", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(NextResponse.json({ ok: false }, { status: 403 }));
    const response = await POST(createRequest());
    expect(response.status).toBe(403);
  });

  it("actualiza pack y escribe auditoría en guardado correcto", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    readAdminPackCommandMock.mockResolvedValueOnce({ id: "pack-core-alpha", cardsPerPack: 5, poolEntries: [], isAvailable: true });
    const upsertPackUseCase = { execute: vi.fn(async () => undefined) };
    const writeAuditLogUseCase = { execute: vi.fn(async () => undefined) };
    createAdminCatalogContextMock.mockResolvedValueOnce({
      profile: { userId: "admin-1" },
      response: NextResponse.json({ ok: true }),
      upsertPackUseCase,
      writeAuditLogUseCase,
    });
    consumeAdminMutationRateLimitMock.mockResolvedValueOnce(true);
    const response = await POST(createRequest());
    expect(response.status).toBe(200);
    expect(upsertPackUseCase.execute).toHaveBeenCalledTimes(1);
    expect(writeAuditLogUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it("responde 403 cuando no hay privilegios administrativos", async () => {
    requireTrustedMutationOriginMock.mockReturnValueOnce(null);
    createAdminCatalogContextMock.mockRejectedValueOnce(new AuthorizationError("No admin"));
    const response = await POST(createRequest());
    expect(response.status).toBe(403);
  });
});
