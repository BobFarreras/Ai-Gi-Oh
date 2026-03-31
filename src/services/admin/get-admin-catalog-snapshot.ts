// src/services/admin/get-admin-catalog-snapshot.ts - Servicio server-side para obtener snapshot admin inicial del catálogo y mercado.
import { GetAdminCatalogSnapshotUseCase } from "@/core/use-cases/admin/GetAdminCatalogSnapshotUseCase";
import { IAdminCatalogSnapshot } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { SupabaseAdminCatalogRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminCatalogRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function getAdminCatalogSnapshot(): Promise<IAdminCatalogSnapshot> {
  const client = await createSupabaseServerClient();
  const repository = new SupabaseAdminCatalogRepository(client);
  const useCase = new GetAdminCatalogSnapshotUseCase(repository);
  return useCase.execute();
}
