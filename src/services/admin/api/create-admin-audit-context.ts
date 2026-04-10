// src/services/admin/api/create-admin-audit-context.ts - Fabrica contexto de auditoría admin con caso de uso y repositorio desacoplados de la ruta.
import { NextRequest } from "next/server";
import { GetAdminAuditLogPageUseCase } from "@/core/use-cases/admin/GetAdminAuditLogPageUseCase";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminAuditLogRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";

export async function createAdminAuditContext(request: NextRequest) {
  const routeContext = await createAdminRouteContext(request);
  const repository = new SupabaseAdminAuditLogRepository(createSupabaseServiceRoleClient());
  return {
    ...routeContext,
    getAuditPageUseCase: new GetAdminAuditLogPageUseCase(repository),
  };
}
