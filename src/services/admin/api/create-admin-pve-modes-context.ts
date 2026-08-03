// src/services/admin/api/create-admin-pve-modes-context.ts - Contexto admin de modos PvE con repositorio service-role y auditoría.
import { NextRequest } from "next/server";
import { WriteAdminAuditLogUseCase } from "@/core/use-cases/admin/WriteAdminAuditLogUseCase";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminAuditLogRepository";
import { SupabaseAdminPveModesRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminPveModesRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";

export async function createAdminPveModesContext(request: NextRequest) {
  const routeContext = await createAdminRouteContext(request);
  const client = createSupabaseServiceRoleClient();
  return {
    ...routeContext,
    repository: new SupabaseAdminPveModesRepository(client),
    writeAuditLogUseCase: new WriteAdminAuditLogUseCase(new SupabaseAdminAuditLogRepository(client)),
  };
}
