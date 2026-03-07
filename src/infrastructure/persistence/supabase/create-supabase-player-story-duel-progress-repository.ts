// src/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository.ts - Factory server-side para progreso de duelos Story en Supabase.
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabasePlayerStoryDuelProgressRepository(): Promise<SupabasePlayerStoryDuelProgressRepository> {
  const client = await createSupabaseServerClient();
  return new SupabasePlayerStoryDuelProgressRepository(client);
}
