// src/infrastructure/persistence/supabase/create-supabase-player-card-progress-repository.ts - Fábrica de repositorio de progresión por carta sobre cliente Supabase server.
import { SupabasePlayerCardProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerCardProgressRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabasePlayerCardProgressRepository(): Promise<SupabasePlayerCardProgressRepository> {
  const client = await createSupabaseServerClient();
  return new SupabasePlayerCardProgressRepository(client);
}
