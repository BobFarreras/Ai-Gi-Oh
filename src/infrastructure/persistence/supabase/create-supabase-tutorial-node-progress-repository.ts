// src/infrastructure/persistence/supabase/create-supabase-tutorial-node-progress-repository.ts - Factory server-side del repositorio de progreso por nodos tutorial.
import { SupabaseTutorialNodeProgressRepository } from "@/infrastructure/persistence/supabase/SupabaseTutorialNodeProgressRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabaseTutorialNodeProgressRepository(): Promise<SupabaseTutorialNodeProgressRepository> {
  const client = await createSupabaseServerClient();
  return new SupabaseTutorialNodeProgressRepository(client);
}
