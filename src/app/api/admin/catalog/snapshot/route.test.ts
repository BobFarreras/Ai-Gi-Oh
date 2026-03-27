// src/app/api/admin/catalog/snapshot/route.test.ts - Verifica respuesta del endpoint snapshot admin y manejo de errores.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { GET } from "@/app/api/admin/catalog/snapshot/route";

const createAdminCatalogContextMock = vi.fn();
const createApiErrorResponseMock = vi.fn();

vi.mock("@/services/admin/api/create-admin-catalog-context", () => ({
  createAdminCatalogContext: (...args: unknown[]) => createAdminCatalogContextMock(...args),
}));

vi.mock("@/services/security/api/create-api-error-response", () => ({
  createApiErrorResponse: (...args: unknown[]) => createApiErrorResponseMock(...args),
}));

describe("GET /api/admin/catalog/snapshot", () => {
  it("responde snapshot cuando el contexto admin es válido", async () => {
    createAdminCatalogContextMock.mockResolvedValueOnce({
      response: NextResponse.json({ ok: true }),
      getSnapshotUseCase: { execute: vi.fn(async () => ({ cards: [], listings: [], packs: [] })) },
    });
    const response = await GET(new NextRequest("http://localhost:3000/api/admin/catalog/snapshot"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ cards: [], listings: [], packs: [] });
  });

  it("delegada errores al formateador de API", async () => {
    createAdminCatalogContextMock.mockRejectedValueOnce(new Error("boom"));
    createApiErrorResponseMock.mockReturnValueOnce(NextResponse.json({ code: "INTERNAL_ERROR" }, { status: 500 }));
    const response = await GET(new NextRequest("http://localhost:3000/api/admin/catalog/snapshot"));
    expect(response.status).toBe(500);
    expect(createApiErrorResponseMock).toHaveBeenCalledTimes(1);
  });

  it("devuelve 403 cuando la sesión no es admin", async () => {
    createAdminCatalogContextMock.mockRejectedValueOnce(new AuthorizationError("No admin"));
    createApiErrorResponseMock.mockReturnValueOnce(NextResponse.json({ code: "AUTHORIZATION_ERROR" }, { status: 403 }));
    const response = await GET(new NextRequest("http://localhost:3000/api/admin/catalog/snapshot"));
    expect(response.status).toBe(403);
  });
});
