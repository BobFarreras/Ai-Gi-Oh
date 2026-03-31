// src/infrastructure/persistence/supabase/create-supabase-training-progress-repository.ts - Factory server-side del repositorio de progreso training.
import { SupabaseTrainingProgressRepository } from "@/infrastructure/persistence/supabase/SupabaseTrainingProgressRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabaseTrainingProgressRepository(): Promise<SupabaseTrainingProgressRepository> {
  const client = await createSupabaseServerClient();
  return new SupabaseTrainingProgressRepository(client);
}
