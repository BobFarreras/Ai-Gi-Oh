// src/infrastructure/persistence/supabase/create-supabase-auth-repository.ts - Factory de repositorio auth para contextos server-side de Next.js.
import { SupabaseAuthRepository } from "@/infrastructure/persistence/supabase/SupabaseAuthRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabaseAuthRepository(): Promise<SupabaseAuthRepository> {
  const client = await createSupabaseServerClient();
  return new SupabaseAuthRepository(client);
}
