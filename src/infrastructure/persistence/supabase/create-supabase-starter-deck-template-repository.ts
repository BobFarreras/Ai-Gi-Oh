// src/infrastructure/persistence/supabase/create-supabase-starter-deck-template-repository.ts - Factory server-side del repositorio de plantilla de deck inicial.
import { SupabaseStarterDeckTemplateRepository } from "@/infrastructure/persistence/supabase/SupabaseStarterDeckTemplateRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabaseStarterDeckTemplateRepository(): Promise<SupabaseStarterDeckTemplateRepository> {
  const client = await createSupabaseServerClient();
  return new SupabaseStarterDeckTemplateRepository(client);
}

