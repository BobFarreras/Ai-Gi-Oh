// src/services/admin/get-admin-shop-objects.ts - Snapshot inicial (server-side) de los objetos del mercado para
// el panel admin. La RLS permite a authenticated leer todo el catálogo (activos e inactivos), así que la lectura
// usa el cliente de sesión; las escrituras (rutas /api/admin/objects/*) van con service-role.
import { GetAdminShopObjectsUseCase } from "@/core/use-cases/admin/GetAdminShopObjectsUseCase";
import { IAdminShopObjectsSnapshot } from "@/core/entities/admin/IAdminShopObjects";
import { SupabaseAdminShopObjectsRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminShopObjectsRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function getAdminShopObjects(): Promise<IAdminShopObjectsSnapshot> {
  const client = await createSupabaseServerClient();
  const repository = new SupabaseAdminShopObjectsRepository(client);
  const useCase = new GetAdminShopObjectsUseCase(repository);
  return useCase.execute();
}
