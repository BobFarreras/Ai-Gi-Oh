// src/infrastructure/persistence/supabase/create-supabase-player-story-world-repository.ts - Factory server-side del repositorio de estado e historial Story.
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabasePlayerStoryWorldRepository(): Promise<SupabasePlayerStoryWorldRepository> {
  const client = await createSupabaseServerClient();
  return new SupabasePlayerStoryWorldRepository(client);
}
