// src/infrastructure/persistence/supabase/create-supabase-player-progress-repository.ts - Factory server-side del repositorio de progreso de jugador.
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabasePlayerProgressRepository(): Promise<SupabasePlayerProgressRepository> {
  const client = await createSupabaseServerClient();
  return new SupabasePlayerProgressRepository(client);
}
