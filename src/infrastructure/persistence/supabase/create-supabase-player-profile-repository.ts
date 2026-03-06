// src/infrastructure/persistence/supabase/create-supabase-player-profile-repository.ts - Factory server-side del repositorio de perfil de jugador.
import { SupabasePlayerProfileRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProfileRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabasePlayerProfileRepository(): Promise<SupabasePlayerProfileRepository> {
  const client = await createSupabaseServerClient();
  return new SupabasePlayerProfileRepository(client);
}
