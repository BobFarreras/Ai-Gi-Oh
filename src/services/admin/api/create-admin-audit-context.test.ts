// src/services/admin/api/create-admin-audit-context.test.ts - Verifica composición del contexto de auditoría admin sin acoplar la ruta a infraestructura.
import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { createAdminAuditContext } from "@/services/admin/api/create-admin-audit-context";

const createAdminRouteContextMock = vi.fn();
const createSupabaseServiceRoleClientMock = vi.fn();

vi.mock("@/services/admin/api/create-admin-route-context", () => ({
  createAdminRouteContext: (...args: unknown[]) => createAdminRouteContextMock(...args),
}));

vi.mock("@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client", () => ({
  createSupabaseServiceRoleClient: (...args: unknown[]) => createSupabaseServiceRoleClientMock(...args),
}));

vi.mock("@/infrastructure/persistence/supabase/admin/SupabaseAdminAuditLogRepository", () => ({
  SupabaseAdminAuditLogRepository: class {},
}));

describe("createAdminAuditContext", () => {
  it("compone contexto base admin y caso de uso de auditoría", async () => {
    createAdminRouteContextMock.mockResolvedValueOnce({
      response: NextResponse.json({ ok: true }),
      profile: { userId: "admin-1", role: "ADMIN" },
    });
    createSupabaseServiceRoleClientMock.mockReturnValueOnce({});
    const context = await createAdminAuditContext(new NextRequest("http://localhost:3000/api/admin/audit"));
    expect(context.profile.userId).toBe("admin-1");
    expect(context.getAuditPageUseCase).toBeDefined();
  });
});
