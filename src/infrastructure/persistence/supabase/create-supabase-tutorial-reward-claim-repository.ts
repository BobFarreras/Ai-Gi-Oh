// src/infrastructure/persistence/supabase/create-supabase-tutorial-reward-claim-repository.ts - Factory server-side del repositorio de claim final tutorial.
import { SupabaseTutorialRewardClaimRepository } from "@/infrastructure/persistence/supabase/SupabaseTutorialRewardClaimRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function createSupabaseTutorialRewardClaimRepository(): Promise<SupabaseTutorialRewardClaimRepository> {
  const client = await createSupabaseServerClient();
  return new SupabaseTutorialRewardClaimRepository(client);
}
