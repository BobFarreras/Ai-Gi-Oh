// src/services/admin/get-admin-live-ops.ts - Servicio server-side: definiciones de live-ops con acceso admin validado (service_role).
import { ILiveOpsAdminData } from "@/core/entities/progression/ILiveOpsAdmin";
import { GetLiveOpsAdminUseCase } from "@/core/use-cases/progression/admin/GetLiveOpsAdminUseCase";
import { SupabaseProgressionAdminRepository } from "@/infrastructure/persistence/supabase/SupabaseProgressionAdminRepository";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { assertAdminAccess } from "@/services/admin/assert-admin-access";

export async function getAdminLiveOps(): Promise<ILiveOpsAdminData> {
  await assertAdminAccess();
  const repository = new SupabaseProgressionAdminRepository(createSupabaseServiceRoleClient());
  return new GetLiveOpsAdminUseCase(repository).execute();
}
