// src/services/admin/api/create-admin-catalog-context.ts - Fabrica repositorio y casos de uso de catálogo para rutas admin de mercado/cartas.
import { NextRequest } from "next/server";
import { GetAdminCatalogSnapshotUseCase } from "@/core/use-cases/admin/GetAdminCatalogSnapshotUseCase";
import { DeleteAdminMarketPackUseCase } from "@/core/use-cases/admin/DeleteAdminMarketPackUseCase";
import { UpsertAdminCardCatalogUseCase } from "@/core/use-cases/admin/UpsertAdminCardCatalogUseCase";
import { UpsertAdminMarketListingUseCase } from "@/core/use-cases/admin/UpsertAdminMarketListingUseCase";
import { UpsertAdminMarketPackUseCase } from "@/core/use-cases/admin/UpsertAdminMarketPackUseCase";
import { SupabaseAdminCatalogRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminCatalogRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { createAdminRouteContext } from "@/services/admin/api/create-admin-route-context";

export async function createAdminCatalogContext(request: NextRequest) {
  const routeContext = await createAdminRouteContext(request);
  const client = createSupabaseServiceRoleClient();
  const repository = new SupabaseAdminCatalogRepository(client);
  return {
    ...routeContext,
    getSnapshotUseCase: new GetAdminCatalogSnapshotUseCase(repository),
    upsertCardUseCase: new UpsertAdminCardCatalogUseCase(repository),
    upsertListingUseCase: new UpsertAdminMarketListingUseCase(repository),
    upsertPackUseCase: new UpsertAdminMarketPackUseCase(repository),
    deletePackUseCase: new DeleteAdminMarketPackUseCase(repository),
  };
}
