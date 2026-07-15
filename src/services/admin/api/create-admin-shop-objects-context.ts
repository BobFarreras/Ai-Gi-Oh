// src/services/admin/api/create-admin-shop-objects-context.ts - Fabrica repositorio y casos de uso del CRUD de
// objetos del mercado para las rutas admin. Reutiliza la frontera de seguridad (createAdminRouteContext) y el
// service-role para escribir.
import { NextRequest } from "next/server";
import { GetAdminShopObjectsUseCase } from "@/core/use-cases/admin/GetAdminShopObjectsUseCase";
import { UpsertAdminCardUpgradeItemUseCase } from "@/core/use-cases/admin/UpsertAdminCardUpgradeItemUseCase";
import { UpsertAdminLevelCandyUseCase } from "@/core/use-cases/admin/UpsertAdminLevelCandyUseCase";
import { WriteAdminAuditLogUseCase } from "@/core/use-cases/admin/WriteAdminAuditLogUseCase";
import { SupabaseAdminAuditLogRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminAuditLogRepository";
import { SupabaseAdminShopObjectsRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminShopObjectsRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";

export async function createAdminShopObjectsContext(request: NextRequest) {
  const routeContext = await createAdminRouteContext(request);
  const client = createSupabaseServiceRoleClient();
  const repository = new SupabaseAdminShopObjectsRepository(client);
  const auditRepository = new SupabaseAdminAuditLogRepository(client);
  return {
    ...routeContext,
    getSnapshotUseCase: new GetAdminShopObjectsUseCase(repository),
    upsertCandyUseCase: new UpsertAdminLevelCandyUseCase(repository),
    upsertUpgradeItemUseCase: new UpsertAdminCardUpgradeItemUseCase(repository),
    writeAuditLogUseCase: new WriteAdminAuditLogUseCase(auditRepository),
  };
}
